import axios from "axios";
import { getChannel } from "./rabbitmq.js";

import { Rider } from "../model/Rider.js";

export const startOrderReadyConsumer = async () => {
  const channel = await getChannel();
  console.log(
    `Consuming order ready events from: ${process.env.ORDER_READY_QUEUE}`,
  );
  channel?.consume(process.env.ORDER_READY_QUEUE!, async (message) => {
    if (message) {
      try {
        console.log("Message received " + message.content.toString());
        const event = JSON.parse(message.content.toString());
        console.log("Event type: " + event.type);
        if (event.type === "ORDER_READY_FOR_RIDER") {
          console.log("Order ready for rider: " + event.data.orderId);
          console.log("Restaurant ID: " + event.data.restaurantId);
          console.log("Location: " + event.data.location);
        }
        if (event.type !== "ORDER_READY_FOR_RIDER") {
          console.log("Skipping non-order-ready-for-rider event");
          channel?.ack(message);
          return;
        }
        const { orderId, restaurantId, location } = event.data;
        console.log("Searching for available rider near :" + location);
        const riders = await Rider.find({
          isAvailable: true,
          isVerified: true,
          location: {
            $near: {
              $geometry: location,
              $maxDistance: 500,
            },
          },
        });

        console.log("Available riders: " + riders.length);
        if (riders.length === 0) {
          console.log("No available rider found");
          channel?.ack(message);
          return;
        }
        for (const rider of riders) {
          console.log("Assigning order to rider: " + rider.userId);
          try {
            await axios.post(
              `${process.env.REALTIME_SERVICE_URL}/api/internal/emit`,
              {
                event: "order:available",
                room: `user:${rider.userId}`,
                payload: { orderId: orderId, restaurantId: restaurantId },
              },
              {
                headers: {
                  "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                },
              },
            );
            console.log(
              "Notified rider: " +
                rider.userId +
                " for order: " +
                orderId +
                " successfully",
            );
          } catch (error) {
            console.error(
              "Error notifying rider: " +
                rider.userId +
                " for order: " +
                orderId +
                " " +
                error,
            );
          }
        }
        channel?.ack(message);
        console.log("Message acknowledged successfully");
      } catch (error) {
        console.error("Order ready consumer error: " + error);
        channel?.ack(message);
        console.log("Message acknowledged successfully");
      }
    }
  });
};
