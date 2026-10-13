import { Request, Response, Router } from "express";
import { getIo } from "../socket.js";
import { isInternalRequest } from "../utils/internalAuth.js";

const router = Router();
const allowedEvents = new Set([
  "order:new",
  "order:update",
  "order:rider_assigned",
  "rider:location",
  "rider:route",
]);
const roomPattern = /^(?:user|restaurant):[a-f\d]{24}$/i;
const riderLocations = new Map<
  string,
  { latitude: number; longitude: number; updatedAt: number }
>();
const RIDER_LOCATION_TTL_MS = 2 * 60 * 1000;
const RIDER_LOCATION_PRUNE_MS = 10 * 60 * 1000;

const cacheRiderLocation = (payload: unknown) => {
  if (typeof payload !== "object" || payload === null) return;
  const location = payload as Record<string, unknown>;
  if (
    typeof location.orderId !== "string" ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number" ||
    location.latitude < -90 ||
    location.latitude > 90 ||
    location.longitude < -180 ||
    location.longitude > 180
  ) {
    return;
  }

  const now = Date.now();
  riderLocations.set(location.orderId, {
    latitude: location.latitude,
    longitude: location.longitude,
    updatedAt: now,
  });
  for (const [orderId, entry] of riderLocations) {
    if (now - entry.updatedAt > RIDER_LOCATION_PRUNE_MS) {
      riderLocations.delete(orderId);
    }
  }
};

router.post("/emit", (req: Request, res: Response) => {
  if (!isInternalRequest(req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { event, payload, room } = req.body as {
    event?: unknown;
    payload?: unknown;
    room?: unknown;
  };
  if (
    typeof event !== "string" ||
    !allowedEvents.has(event) ||
    typeof room !== "string" ||
    !roomPattern.test(room) ||
    typeof payload === "undefined"
  ) {
    return res.status(400).json({ message: "Invalid realtime event" });
  }

  if (event === "rider:location") cacheRiderLocation(payload);
  getIo().to(room).emit(event, payload);
  return res.status(200).json({ success: true });
});

router.get("/rider-location/:orderId", (req: Request, res: Response) => {
  if (!isInternalRequest(req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const orderId = Array.isArray(req.params.orderId)
    ? req.params.orderId[0]
    : req.params.orderId;
  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }
  const entry = riderLocations.get(orderId);
  if (!entry || Date.now() - entry.updatedAt > RIDER_LOCATION_TTL_MS) {
    return res
      .status(404)
      .json({ message: "No recent rider location for this order" });
  }

  return res.status(200).json({
    latitude: entry.latitude,
    longitude: entry.longitude,
    updatedAt: entry.updatedAt,
  });
});

export default router;
