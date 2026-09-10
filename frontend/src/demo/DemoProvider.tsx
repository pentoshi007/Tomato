import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import type { Location } from "../types";
import { installDemoApi, uninstallDemoApi } from "./api";
import { DEMO_CITY } from "./config";
import { demoSocket } from "./socket";
import { demoStore } from "./store";
import type { DemoRole, DemoSeed } from "./types";
import { DemoContext, type DemoContextValue } from "./useDemo";

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<DemoRole | null>(() => {
    installDemoApi();
    return demoStore.restore();
  });
  const [origin, setOrigin] = useState<Location | null>(() => demoStore.origin);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    installDemoApi();
    return () => uninstallDemoApi();
  }, []);

  const enter = useCallback((nextRole: DemoRole, seed: DemoSeed) => {
    demoSocket.reset();
    demoStore.start(nextRole, seed);
    setOrigin(demoStore.origin);
    setRole(nextRole);
    setInviteOpen(false);
    toast.success("Demo mode on — nothing here touches your account");
  }, []);

  const exit = useCallback(() => {
    demoStore.stop();
    demoSocket.reset();
    setOrigin(null);
    setRole(null);
    setInviteOpen(false);
    toast.success("Back to your real account");
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      active: role !== null,
      role,
      origin,
      city: role !== null ? DEMO_CITY : null,
      inviteOpen,
      openInvite: () => {
        setInviteOpen(true);
      },
      closeInvite: () => {
        setInviteOpen(false);
      },
      enter,
      exit,
    }),
    [role, origin, inviteOpen, enter, exit],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};
