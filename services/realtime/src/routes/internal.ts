import { Request, Response, Router } from "express";
import { getIo } from "../socket.js";

const router = Router();

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

    const io = getIo();
    console.log(`Emitting event: ${event} to room: ${room || "all"}, payload:`, payload);
    
    if (room) {
        io.to(room).emit(event, payload);
    } else {
        io.emit(event, payload);
    }

    return res.status(200).json({ success: true });
});

export default router;

