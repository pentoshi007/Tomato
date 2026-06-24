import { createContext } from "react";
import type { Socket } from "socket.io-client";

export interface SocketContextType {
  socket: Socket | null;
  reconnect: () => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  reconnect: () => {},
});
