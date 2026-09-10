import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import {
  ORDER_REALTIME_EVENTS,
  buildOrderPayload,
  emitRealtime,
} from "../utils/realtime.js";
import { publishEvent } from "./order.publisher.js";

const KITCHEN_STEPS = [
  { from: "placed", to: "accepted", delayMs: 12_000 },
  { from: "accepted", to: "preparing", delayMs: 18_000 },
  { from: "preparing", to: "ready_for_rider", delayMs: 20_000 },
] as const;

const runKitchenStep = async (orderId: string, stepIndex: number) => {
  const step = KITCHEN_STEPS[stepIndex];
  if (!step) return;
  await new Promise((resolve) => setTimeout(resolve, step.delayMs));
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: step.from, paymentStatus: "paid" },
    { status: step.to },
    { returnDocument: "after" },
  );
  if (!order) return;
  await emitRealtime(
    ORDER_REALTIME_EVENTS.UPDATE,
    `user:${order.userId.toString()}`,
    buildOrderPayload(order),
  );
  if (step.to === "ready_for_rider") {
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant) {
      await publishEvent("ORDER_READY_FOR_RIDER", {
        orderId: order._id.toString(),
        restaurantId: order.restaurantId.toString(),
        location: restaurant.autoLocation,
        demo: true,
        demoClusterKey: restaurant.demoClusterKey,
        delivery: {
          latitude: order.deliveryAddress.latitude,
          longitude: order.deliveryAddress.longitude,
          userId: order.userId.toString(),
        },
      });
    }
    return;
  }
  await runKitchenStep(orderId, stepIndex + 1);
};

const stepIndexAfter = (status: string) =>
  KITCHEN_STEPS.findIndex((step) => step.from === status);

export const startDemoKitchen = (orderId: string) => {
  void runKitchenStep(orderId, 0).catch((error) =>
    console.log(`demo kitchen failed for ${orderId}`, error),
  );
};

export const resumeDemoKitchens = async () => {
  const demoRestaurants = await Restaurant.find({ type: "demo" })
    .select("_id")
    .lean();
  const demoOrders = await Order.find({
    restaurantId: { $in: demoRestaurants.map((r) => r._id) },
    paymentStatus: "paid",
    status: { $in: KITCHEN_STEPS.map((step) => step.from) },
  })
    .select("_id status")
    .lean();
  for (const order of demoOrders) {
    const stepIndex = stepIndexAfter(order.status);
    if (stepIndex >= 0) {
      void runKitchenStep(order._id.toString(), stepIndex).catch((error) =>
        console.log(`demo kitchen resume failed for ${order._id}`, error),
      );
    }
  }
};
