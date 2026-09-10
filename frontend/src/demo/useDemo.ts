import { createContext, useContext } from "react";
import type { Location } from "../types";
import type { DemoRole, DemoSeed, InviteReason } from "./types";

export interface DemoContextValue {
  active: boolean;
  role: DemoRole | null;
  origin: Location | null;
  city: string | null;
  inviteOpen: boolean;
  inviteReason: InviteReason | null;
  openInvite: (reason?: InviteReason) => void;
  closeInvite: () => void;
  enter: (role: DemoRole, seed: DemoSeed) => void;
  exit: () => void;
}

export const DemoContext = createContext<DemoContextValue>({
  active: false,
  role: null,
  origin: null,
  city: null,
  inviteOpen: false,
  inviteReason: null,
  openInvite: () => {},
  closeInvite: () => {},
  enter: () => {},
  exit: () => {},
});

export const useDemo = () => useContext(DemoContext);
