import axios from "axios";

type RealtimePayload = Record<string, unknown>;

export const ORDER_REALTIME_EVENTS = {
  NEW: "order:new",
  UPDATE: "order:update",
} as const;

export const emitRealtime = async (
  event: string,
  room: string,
  payload: RealtimePayload,
) => {
  await axios.post(
    `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
    { event, room, payload },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
      },
    },
  );
};

export const buildOrderPayload = (order: {
  _id: unknown;
  status: unknown;
}): RealtimePayload => ({
  orderId: order._id,
  status: order.status,
});
