import type {
  IAddress,
  IMenuItem,
  IOrder,
  IRestaurant,
  IRider,
  Location,
} from "../types";

export type DemoRole = "customer" | "seller" | "rider";

export const DEMO_ROLES: DemoRole[] = ["customer", "seller", "rider"];

export interface DemoSeed {
  userId: string;
  userName: string;
  origin: Location | null;
}

export interface DemoCartLine {
  restaurantId: string;
  itemId: string;
  quantity: number;
}

export interface DemoState {
  role: DemoRole;
  userId: string;
  userName: string;
  origin: Location;
  restaurants: IRestaurant[];
  keywords: Record<string, string[]>;
  items: Record<string, IMenuItem[]>;
  myRestaurantId: string;
  cart: DemoCartLine[];
  addresses: IAddress[];
  orders: IOrder[];
  rider: IRider;
  positions: Record<string, [number, number]>;
  progress: Record<string, number>;
  schedule: Record<string, number>;
  seq: number;
}

export interface DemoResult {
  status?: number;
  data: unknown;
  message?: string;
}
