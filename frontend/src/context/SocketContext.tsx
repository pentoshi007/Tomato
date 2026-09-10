import {
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAppContext } from "./AppContext";
import { realtimeService } from "../config";
import { SocketContext } from "./socketContext";
import { demoSocketAsClient } from "../demo/socket";
import { useDemo } from "../demo/useDemo";

// ---------------------------------------------------------------------------
// Module-level socket store — lets us update the socket without calling
// setState inside an effect, using useSyncExternalStore for reactivity.
// ---------------------------------------------------------------------------
let _socket: Socket | null = null;
const _listeners = new Set<() => void>();

const socketStore = {
  subscribe: (cb: () => void) => {
    _listeners.add(cb);
    return () => _listeners.delete(cb);
  },
  getSnapshot: () => _socket,
};

const notifyListeners = () => _listeners.forEach((l) => l());

// ---------------------------------------------------------------------------

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuth } = useAppContext();
  const { active: demoActive } = useDemo();

  // Reactive read from the external store — no useState needed
  const socket = useSyncExternalStore(
    socketStore.subscribe,
    socketStore.getSnapshot,
  );

  const createSocket = useCallback(() => {
    if (_socket) {
      _socket.disconnect();
      _socket = null;
    }
    const token = localStorage.getItem("token");
    if (!token) return;

    const s = io(realtimeService, {
      auth: { token },
      transports: ["websocket"],
    });
    _socket = s;
    notifyListeners();

    s.on("connect", () => console.log("[socket] connected", s.id));
    s.on("disconnect", () => console.log("[socket] disconnected"));
    s.on("connect_error", (err) => console.log("[socket] error:", err.message));
  }, []);

  const destroySocket = useCallback(() => {
    if (_socket) {
      _socket.disconnect();
      _socket = null;
      notifyListeners();
    }
  }, []);

  useEffect(() => {
    if (!isAuth || demoActive) {
      destroySocket();
      return;
    }
    createSocket();
    return destroySocket;
  }, [isAuth, demoActive, createSocket, destroySocket]);

  // Call after saving an updated token to localStorage so the socket
  // reconnects and joins the correct rooms (e.g. restaurant:<id>).
  const reconnect = useCallback(() => {
    if (!isAuth) return;
    createSocket();
  }, [isAuth, createSocket]);

  const value = useMemo(
    () =>
      demoActive
        ? { socket: demoSocketAsClient(), reconnect: () => {} }
        : { socket, reconnect },
    [demoActive, socket, reconnect],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
