import { getChannel } from "./rabbitmq.js";
export const publishPaymentSuccess = async (payload: {
  orderId: string;
  paymentId: string;
  provider: "razorpay" | "stripe";
}) => {
  const channel = getChannel();
  if (!channel) {
    throw new Error("Channel not found");
  }
  try {
    await channel.sendToQueue(
      process.env.PAYMENT_QUEUE!,
      Buffer.from(
        JSON.stringify({
          type: "PAYMENT_SUCCESS",
          data: payload,
        }),
      ),
      { persistent: true },
    );
    console.log("Payment success published to queue");
  } catch (error) {
    throw new Error("Failed to publish payment success");
  }
};
