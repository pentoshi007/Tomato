import type { OrderStatus } from "../types";

export const DEMO_STORAGE_KEY = "tomato.demo.state.v1";

export const DEMO_ORIGIN = {
  latitude: 28.5468576,
  longitude: 77.1786905,
  formattedAddress: "Hauz Khas Village, New Delhi",
};

export const DEMO_CITY = "New Delhi";

export const TICK_MS = 1000;
export const LATENCY_MS = 140;
export const RIDER_PING_MS = 3000;
export const AVAILABLE_PULSE_MS = 12000;
export const SPAWN_INTERVAL_MS = 80000;
export const MAX_LIVE_ORDERS = 6;

export const STATUS_DELAY_MS: Partial<Record<OrderStatus, number>> = {
  placed: 9000,
  accepted: 11000,
  preparing: 15000,
  ready_for_rider: 30000,
  rider_assigned: 13000,
  picked_up: 42000,
};
