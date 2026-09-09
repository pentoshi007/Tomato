import { Request, Response, Router } from "express";
import { getIo } from "../socket.js";

const router = Router();

// Last known rider position per order. Customers opening the order page
// read this to render the rider immediately instead of waiting up to 10s
// for the rider's next live emit.
const riderLocations = new Map<
    string,
    { latitude: number; longitude: number; updatedAt: number }
>();

const RIDER_LOCATION_TTL_MS = 2 * 60 * 1000;
const RIDER_LOCATION_PRUNE_MS = 10 * 60 * 1000;

const cacheRiderLocation = (payload: unknown) => {
    const location = payload as
        | { orderId?: unknown; latitude?: unknown; longitude?: unknown }
        | undefined
        | null;

    if (
        !location ||
        typeof location.orderId !== "string" ||
        typeof location.latitude !== "number" ||
        typeof location.longitude !== "number"
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
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const { event, payload, room } = req.body as {
        event?: string;
        payload?: unknown;
        room?: string;
    };

    if (!event || typeof payload === "undefined") {
        return res.status(400).json({ error: "Event and payload are required" });
    }

    if (event === "rider:location") {
        cacheRiderLocation(payload);
    }

    const io = getIo();
    console.log(`Emitting event: ${event} to room: ${room || "all"}, payload:`, payload);
    
    if (room) {
        io.to(room).emit(event, payload);
    } else {
        io.emit(event, payload);
    }

    return res.status(200).json({ success: true });
});

router.get("/rider-location/:orderId", (req: Request, res: Response) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
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
