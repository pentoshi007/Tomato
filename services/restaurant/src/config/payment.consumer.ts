import { getChannel } from "./rabbitmq.js";
import Order from "../models/Order.js";
import axios from "axios";
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

      //socket work
      await axios.post(
        `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
        {
          event: "order:new",
          room: `restaurant_${order.restaurantId.toString()}`,
          payload: {
            orderId: order._id,
            status: order.status,
          },
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
          },
        },
      );

      channel.ack(message);
    } catch (error) {
      console.error("🐰 Error in payment consumer", error);
      channel.ack(message);
    }
  });
};
