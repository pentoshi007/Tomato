import {
  Burger,
  Scooter,
  SteamBowl,
  type RoleIllustration,
} from "../components/ui/illustrations";
import type { DemoRole } from "./types";

export interface Persona {
  role: DemoRole;
  label: string;
  title: string;
  blurb: string;
  Icon: RoleIllustration;
  bg: string;
}

export const PERSONAS: Persona[] = [
  {
    role: "customer",
    label: "Customer",
    title: "Order as a customer",
    blurb:
      "Browse nearby kitchens, build a tray, check out without paying and track the rider live.",
    Icon: Burger,
    bg: "bg-blush",
  },
  {
    role: "seller",
    label: "Kitchen",
    title: "Run a kitchen",
    blurb:
      "A live order board with tickets you can accept, prep and hand to a rider.",
    Icon: SteamBowl,
    bg: "bg-butter",
  },
  {
    role: "rider",
    label: "Rider",
    title: "Ride deliveries",
    blurb:
      "Go online, claim incoming requests and finish a run from pickup to drop-off.",
    Icon: Scooter,
    bg: "bg-skywash",
  },
];

export const personaLabel = (role: DemoRole | null) =>
  PERSONAS.find((persona) => persona.role === role)?.label ?? "Demo";
