import axios from "axios";
import { getChannel } from "./rabbitmq.js";

import { Rider } from "../model/Rider.js";
import { ensureDemoRiders } from "../utils/demoRiderSeed.js";
import { withGeoIndexRepair } from "../utils/geoIndex.js";
import {
  createRouteWalker,
  fetchDrivingRoute,
  type RouteWalker,
} from "../utils/routePath.js";

type GeoPoint = { type: string; coordinates: [number, number] };

const emitInternal = async (event: string, room: string, payload: unknown) => {
  await axios.post(
    `${process.env.REALTIME_SERVICE_URL}/api/internal/emit`,
    { event, room, payload },
    { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "" } },
  );
};

const callRestaurantService = async (
  path: string,
  body: Record<string, unknown>,
) => {
  const { data } = await axios.put(
    `${process.env.RESTAURANT_SERVICE}${path}`,
    body,
    { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "" } },
  );
  return data;
};

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const PICKUP_TRAVEL_MS_PER_KM = 22_000;
const PICKUP_TRAVEL_MIN_MS = 15_000;
const DELIVERY_TRAVEL_MS_PER_KM = 26_000;
const DELIVERY_TRAVEL_MIN_MS = 20_000;
const LOCATION_PING_MS = 3_000;

const moveAlongRoute = (
  walker: RouteWalker,
  totalMs: number,
  onPing: (point: [number, number]) => Promise<void>,
) =>
  new Promise<void>((resolve) => {
    const startedAt = Date.now();
    const tick = async () => {
      const ratio = Math.min(1, (Date.now() - startedAt) / totalMs);
      await onPing(walker.pointAt(ratio));
      if (ratio >= 1) {
        resolve();
        return;
      }
      setTimeout(() => void tick(), LOCATION_PING_MS);
    };
    void tick();
  });

type RoutePhase = "pickup" | "delivery";

type ActiveRoute = {
  phase: RoutePhase;
  path: [number, number][];
  startedAt: number;
  durationMs: number;
};

const beginRoutePhase = async (
  orderId: string,
  userId: string,
  phase: RoutePhase,
  start: [number, number],
  end: [number, number],
  msPerKm: number,
  minMs: number,
) => {
  const route = await fetchDrivingRoute(start, end);
  const walker = createRouteWalker(route?.path ?? [start, end]);
  if (!walker) return null;
  const totalMs = Math.max(minMs, walker.totalKm * msPerKm);
  const payload: ActiveRoute = {
    phase,
    path: walker.path,
    startedAt: Date.now(),
    durationMs: totalMs,
  };
  await callRestaurantService("/api/order/route", {
    orderId,
    route: payload,
  }).catch((error) => {
    console.log(`demo route persist failed for ${orderId}`, error);
  });
  await emitInternal("rider:route", `user:${userId}`, {
    orderId,
    ...payload,
  }).catch(() => undefined);
  return { walker, totalMs };
};

const claimDemoRider = async (
  clusterKey: string | undefined,
  excludeRiderIds: string[],
) => {
  const filter: Record<string, unknown> = {
    type: "demo",
    isAvailable: false,
    isVerified: true,
  };
  if (clusterKey) filter.demoClusterKey = clusterKey;
  if (excludeRiderIds.length > 0) filter._id = { $nin: excludeRiderIds };
  return Rider.findOneAndUpdate(
    filter,
    { $set: { lastActiveAt: new Date() } },
    { sort: { lastActiveAt: 1 }, returnDocument: "after" },
  );
};

const runDemoDelivery = async (
  orderId: string,
  userId: string,
  clusterKey: string | undefined,
  restaurantLocation: GeoPoint,
  deliveryLocation: { latitude: number; longitude: number },
  excludeRiderIds: string[],
) => {
  const triedRiderIds: string[] = [];
  let rider = await claimDemoRider(clusterKey, [
    ...excludeRiderIds,
    ...triedRiderIds,
  ]);
  while (rider) {
    const assigned = await callRestaurantService("/api/order/assign/rider", {
      orderId,
      riderId: rider._id.toString(),
      riderName: rider.name || `Rider ${rider.phoneNumber.slice(-4)}`,
      riderPhone: rider.phoneNumber,
    }).catch((error) => {
      console.log(`demo rider assignment failed for ${orderId}`, error);
      return null;
    });
    if (assigned?.success) break;
    triedRiderIds.push(rider._id.toString());
    rider = await claimDemoRider(clusterKey, [...excludeRiderIds, ...triedRiderIds]);
  }
  if (!rider) {
    console.log(`no demo rider available for ${orderId}`);
    return;
  }

  const riderStart: [number, number] = [
    rider.location.coordinates[1],
    rider.location.coordinates[0],
  ];
  const pickupPoint: [number, number] = [
    restaurantLocation.coordinates[1],
    restaurantLocation.coordinates[0],
  ];
  const deliveryPoint: [number, number] = [
    deliveryLocation.latitude,
    deliveryLocation.longitude,
  ];

  const pingRiderLocation = (point: [number, number]) =>
    emitInternal("rider:location", `user:${userId}`, {
      orderId,
      latitude: point[0],
      longitude: point[1],
    }).catch(() => undefined);

  const pickup = await beginRoutePhase(
    orderId,
    userId,
    "pickup",
    riderStart,
    pickupPoint,
    PICKUP_TRAVEL_MS_PER_KM,
    PICKUP_TRAVEL_MIN_MS,
  );
  if (pickup) {
    await moveAlongRoute(pickup.walker, pickup.totalMs, pingRiderLocation);
  }

  const picked = await callRestaurantService(
    "/api/order/update/status/rider",
    { orderId },
  ).catch(() => null);
  if (!picked?.success) return;

  const delivery = await beginRoutePhase(
    orderId,
    userId,
    "delivery",
    pickupPoint,
    deliveryPoint,
    DELIVERY_TRAVEL_MS_PER_KM,
    DELIVERY_TRAVEL_MIN_MS,
  );
  if (delivery) {
    await moveAlongRoute(delivery.walker, delivery.totalMs, pingRiderLocation);
  }

  await delay(2_000);
  await callRestaurantService("/api/order/update/status/rider", {
    orderId,
  }).catch(() => undefined);
  await Rider.updateOne(
    { _id: rider._id },
    { lastActiveAt: new Date(), isAvailable: false },
  );
};

const previousDemoOrderQuery = async (userId: string, before: Date) => {
  try {
    const { data } = await axios.get(
      `${process.env.RESTAURANT_SERVICE}/api/order/demo/previous-rider`,
      {
        params: { userId, before: before.toISOString() },
        headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "" },
      },
    );
    return (data?.riderId as string | undefined) ?? null;
  } catch {
    return null;
  }
};

export const startDemoDelivery = async (event: {
  orderId: string;
  restaurantId: string;
  demoClusterKey?: string;
  location: GeoPoint;
  delivery?: { latitude: number; longitude: number; userId?: string };
}) => {
  if (!event.delivery || !event.delivery.userId) {
    console.log(`demo delivery skipped for ${event.orderId}: no delivery info`);
    return;
  }
  if (event.demoClusterKey) {
    await ensureDemoRiders(
      event.demoClusterKey,
      event.location.coordinates[1],
      event.location.coordinates[0],
    ).catch((error) =>
      console.log(`demo rider backfill failed for ${event.orderId}`, error),
    );
  }
  const previousRiderId = await previousDemoOrderQuery(
    event.delivery.userId,
    new Date(),
  );
  await runDemoDelivery(
    event.orderId,
    event.delivery.userId,
    event.demoClusterKey,
    event.location,
    {
      latitude: event.delivery.latitude,
      longitude: event.delivery.longitude,
    },
    previousRiderId ? [previousRiderId] : [],
  ).catch((error) =>
    console.log(`demo delivery failed for ${event.orderId}`, error),
  );
};

export const startOrderReadyConsumer = async () => {
  const channel = await getChannel();
  console.log(
    `Consuming order ready events from: ${process.env.ORDER_READY_QUEUE}`,
  );
  channel?.consume(process.env.ORDER_READY_QUEUE!, async (message) => {
    if (message) {
      try {
        const event = JSON.parse(message.content.toString());
        if (event.type !== "ORDER_READY_FOR_RIDER") {
          channel?.ack(message);
          return;
        }
        const { orderId, restaurantId, location, demo, demoClusterKey, delivery } = event.data;
        if (demo) {
          await startDemoDelivery({
            orderId,
            restaurantId,
            demoClusterKey,
            location,
            delivery,
          });
          channel?.ack(message);
          return;
        }
        console.log("Searching for available rider near :" + location);
        const riders = await withGeoIndexRepair(() =>
          Rider.find({
            isAvailable: true,
            isVerified: true,
            type: "normal",
            location: {
              $near: {
                $geometry: location,
                $maxDistance: 500,
              },
            },
          }),
        );

        console.log("Available riders: " + riders.length);
        if (riders.length === 0) {
          console.log("No available rider found");
          channel?.ack(message);
          return;
        }
        for (const rider of riders) {
          try {
            await emitInternal("order:available", `user:${rider.userId}`, {
              orderId: orderId,
              restaurantId: restaurantId,
            });
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
      } catch (error) {
        console.error("Order ready consumer error: " + error);
        channel?.ack(message);
      }
    }
  });
};
