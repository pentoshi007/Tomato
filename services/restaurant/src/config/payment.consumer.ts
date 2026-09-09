import { getChannel } from "./rabbitmq.js";
import Order from "../models/Order.js";
import {
  ORDER_REALTIME_EVENTS,
  buildOrderPayload,
  emitRealtime,
} from "../utils/realtime.js";

export const consumePaymentEvents = async () => {
  const channel = getChannel();
  if (!channel) {
    throw new Error("Channel not found");
  }
  await channel.consume(process.env.PAYMENT_QUEUE!, async (message) => {
    if (!message) return;
    try {
      const event = JSON.parse(message.content.toString());
      console.log(event);
      if (event.type !== "PAYMENT_SUCCESS") {
        channel.ack(message);
        return;
      }
      const { orderId, paymentId, provider } = event.data;
      const order = await Order.findOneAndUpdate(
        { _id: orderId, paymentStatus: { $ne: "paid" } },
        {
          $set: {
            paymentStatus: "paid",
            paymentId,
            paymentMethod: provider,
            status: "placed",
          },
          $unset: {
            expiresAt: 1,
          },
        },
        { returnDocument: "after", runValidators: true },
      );
      if (!order) {
        channel.ack(message);
        return;
      }

      console.log("🎉 Order paid successfully 🐰");

      const payload = buildOrderPayload(order);
      await Promise.all([
        emitRealtime(
          ORDER_REALTIME_EVENTS.NEW,
          `restaurant:${order.restaurantId.toString()}`,
          payload,
        ),
        emitRealtime(
          ORDER_REALTIME_EVENTS.NEW,
          `user:${order.userId.toString()}`,
          payload,
        ),
      ]);

      channel.ack(message);
    } catch (error) {
      console.error("🐰 Error in payment consumer", error);
      channel.ack(message);
    }
  });
};
