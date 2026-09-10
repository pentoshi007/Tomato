import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import type { Location } from "../types";
import { installDemoApi, uninstallDemoApi } from "./api";
import { DEMO_CITY, DEMO_INVITE_KEY } from "./config";
import { demoSocket } from "./socket";
import { demoStore } from "./store";
import type { DemoRole, DemoSeed, InviteReason } from "./types";
import { DemoContext, type DemoContextValue } from "./useDemo";

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<DemoRole | null>(() => {
    installDemoApi();
    return demoStore.restore();
  });
  const [origin, setOrigin] = useState<Location | null>(() => demoStore.origin);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteReason, setInviteReason] = useState<InviteReason | null>(null);

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
    window.sessionStorage.setItem(DEMO_INVITE_KEY, "1");
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
      inviteReason,
      openInvite: (reason?: InviteReason) => {
        setInviteReason(reason ?? "manual");
        setInviteOpen(true);
      },
      closeInvite: () => {
        setInviteOpen(false);
        setInviteReason(null);
        window.sessionStorage.setItem(DEMO_INVITE_KEY, "1");
      },
      enter,
      exit,
    }),
    [role, origin, inviteOpen, inviteReason, enter, exit],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};
