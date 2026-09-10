import axios from "axios";
import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import MenuItems from "../models/MenuItems.js";
import { DEMO_RESTAURANT_CATALOG } from "./demoCatalog.js";
import { destinationPoint } from "../utils/geo.js";
import { ensureGeoIndexes } from "../utils/geoIndex.js";

const CLUSTER_DEDUPE_KM = 8;
const GEOCODE_TIMEOUT_MS = 3000;
const EARTH_RADIUS_KM = 6371;

type AreaContext = { city: string | null; suburb: string | null };

const areaCache = new Map<string, AreaContext>();

const fetchAreaContext = async (
  latitude: number,
  longitude: number,
  clusterKey: string,
): Promise<AreaContext> => {
  const cached = areaCache.get(clusterKey);
  if (cached) return cached;
  try {
    const { data } = await axios.get(
      `${process.env.UTILS_SERVICE}/api/geocode/reverse`,
      {
        params: { lat: latitude, lon: longitude },
        timeout: GEOCODE_TIMEOUT_MS,
      },
    );
    const address = data?.address ?? {};
    const area: AreaContext = {
      city:
        address.city ||
        address.town ||
        address.village ||
        address.state_district ||
        null,
      suburb: address.suburb || address.neighbourhood || address.quarter || null,
    };
    areaCache.set(clusterKey, area);
    return area;
  } catch {
    return { city: null, suburb: null };
  }
};

const composeAddress = (
  addressLine: string,
  area: AreaContext,
  latitude: number,
  longitude: number,
) => {
  const place = [area.suburb, area.city].filter(Boolean).join(", ");
  return place
    ? `${addressLine}, ${place}`
    : `${addressLine} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
};

const clusterKeyOf = (latitude: number, longitude: number) =>
  `${latitude.toFixed(2)}:${longitude.toFixed(2)}`;

const seedRidersForCluster = (
  clusterKey: string,
  latitude: number,
  longitude: number,
) => {
  const riderServiceUrl = process.env.RIDER_SERVICE_URL;
  if (!riderServiceUrl) return Promise.resolve();
  return axios
    .post(
      `${riderServiceUrl}/api/rider/internal/demo/seed`,
      { clusterKey, latitude, longitude },
      {
        headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "" },
        timeout: 8000,
      },
    )
    .then(() => undefined);
};

const nearbyDemoCount = (latitude: number, longitude: number) =>
  Restaurant.countDocuments({
    type: "demo",
    autoLocation: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], CLUSTER_DEDUPE_KM / EARTH_RADIUS_KM],
      },
    },
  });

const buildCluster = async (latitude: number, longitude: number) => {
  const clusterKey = clusterKeyOf(latitude, longitude);
  await ensureGeoIndexes();
  const [area, existing] = await Promise.all([
    fetchAreaContext(latitude, longitude, clusterKey),
    Restaurant.find({ type: "demo", demoClusterKey: clusterKey }, { name: 1 })
      .lean(),
  ]);
  const existingByName = new Map<string, mongoose.Types.ObjectId>(
    existing.map((restaurant) => [restaurant.name, restaurant._id]),
  );

  const newDocs = DEMO_RESTAURANT_CATALOG.filter(
    (seed) => !existingByName.has(seed.name),
  ).map((seed) => {
    const point = destinationPoint(
      latitude,
      longitude,
      seed.bearingDeg,
      seed.distanceKm,
    );
    return {
      _id: new mongoose.Types.ObjectId(),
      name: seed.name,
      description: seed.description,
      image: seed.image,
      phone: seed.phone,
      ownerId: `demo:${clusterKey}`,
      isVerified: true,
      isOpen: true,
      type: "demo" as const,
      demoClusterKey: clusterKey,
      autoLocation: {
        type: "Point" as const,
        coordinates: [point.longitude, point.latitude],
        formattedAddress: composeAddress(
          seed.addressLine,
          area,
          point.latitude,
          point.longitude,
        ),
      },
    };
  });

  if (newDocs.length > 0) {
    await Restaurant.insertMany(newDocs, { ordered: false }).catch((error) => {
      console.log("demo restaurant insert skipped", error);
    });
    const inserted = await Restaurant.find(
      { _id: { $in: newDocs.map((doc) => doc._id) } },
      { name: 1 },
    ).lean();
    for (const doc of inserted) {
      existingByName.set(doc.name, doc._id);
    }
  }

  const menuCounts = await MenuItems.aggregate([
    { $match: { demoClusterKey: clusterKey } },
    { $group: { _id: "$restaurantId", count: { $sum: 1 } } },
  ]);
  const menuCountByRestaurant = new Map(
    menuCounts.map((entry) => [String(entry._id), entry.count]),
  );

  const menuDocs = DEMO_RESTAURANT_CATALOG.flatMap((seed) => {
    const restaurantId = existingByName.get(seed.name);
    if (!restaurantId) return [];
    if ((menuCountByRestaurant.get(String(restaurantId)) ?? 0) > 0) return [];
    return seed.menu.map((item) => ({
      ...item,
      restaurantId,
      isAvailable: true,
      type: "demo" as const,
      demoClusterKey: clusterKey,
    }));
  });
  if (menuDocs.length > 0) {
    await MenuItems.insertMany(menuDocs, { ordered: false }).catch((error) => {
      console.log("demo menu insert skipped", error);
    });
  }

  void seedRidersForCluster(clusterKey, latitude, longitude).catch((error) => {
    console.log("demo rider seeding skipped", error);
  });
};

const inFlightSeeds = new Map<string, Promise<void>>();

export const seedDemoCluster = async (
  latitude: number,
  longitude: number,
): Promise<void> => {
  const clusterKey = clusterKeyOf(latitude, longitude);
  const pending = inFlightSeeds.get(clusterKey);
  if (pending) {
    await pending.catch(() => undefined);
    return;
  }
  const nearbyDemo = await nearbyDemoCount(latitude, longitude);
  if (nearbyDemo >= DEMO_RESTAURANT_CATALOG.length) return;

  const task = buildCluster(latitude, longitude).finally(() => {
    inFlightSeeds.delete(clusterKey);
  });
  inFlightSeeds.set(clusterKey, task);
  await task.catch(() => undefined);
};
