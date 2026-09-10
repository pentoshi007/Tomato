import axios from "axios";
import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import MenuItems from "../models/MenuItems.js";
import { DEMO_RESTAURANT_CATALOG } from "./demoCatalog.js";
import { destinationPoint } from "../utils/geo.js";
import { getDistanceKm } from "../utils/getDistanceKm.js";
import { fetchFoodPois, type FoodPoi } from "../utils/overpassPois.js";
import { ensureGeoIndexes } from "../utils/geoIndex.js";

const CLUSTER_DEDUPE_KM = 8;
const GEOCODE_TIMEOUT_MS = 3000;
const EARTH_RADIUS_KM = 6371;
const POI_SEARCH_RADIUS_KM = 7;

type AreaContext = { city: string | null; suburb: string | null };

type SeedLocation = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
};

const addressScore = (poi: FoodPoi) =>
  (poi.housenumber ? 2 : 0) +
  (poi.street ? 2 : 0) +
  (poi.suburb ? 1 : 0) +
  (poi.city ? 1 : 0);

const poiAddress = (poi: FoodPoi, area: AreaContext) => {
  const line1 =
    [poi.housenumber, poi.street].filter(Boolean).join(" ") || poi.name;
  const place = [poi.suburb, poi.city ?? area.city, poi.postcode]
    .filter(Boolean)
    .join(", ");
  return place ? `${line1}, ${place}` : line1;
};

const selectPoiLocations = (
  pois: FoodPoi[],
  count: number,
  latitude: number,
  longitude: number,
  area: AreaContext,
): SeedLocation[] => {
  const byName = new Map<string, FoodPoi>();
  for (const poi of pois) {
    const key = poi.name.toLowerCase().replace(/\s+/g, " ").trim();
    const known = byName.get(key);
    if (!known || addressScore(poi) > addressScore(known)) byName.set(key, poi);
  }
  const sorted = [...byName.values()].sort(
    (a, b) =>
      getDistanceKm(latitude, longitude, a.latitude, a.longitude) -
      getDistanceKm(latitude, longitude, b.latitude, b.longitude),
  );
  if (sorted.length < count) return [];
  const picked: FoodPoi[] = [];
  for (let i = 0; i < count; i++) {
    const start = Math.floor((i * sorted.length) / count);
    const end = Math.max(
      start + 1,
      Math.floor(((i + 1) * sorted.length) / count),
    );
    const best = sorted
      .slice(start, end)
      .sort((a, b) => addressScore(b) - addressScore(a))[0];
    if (best) picked.push(best);
  }
  if (picked.length < count) return [];
  return picked.map((poi) => ({
    latitude: poi.latitude,
    longitude: poi.longitude,
    formattedAddress: poiAddress(poi, area),
  }));
};

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

const fallbackLocation = (
  seed: (typeof DEMO_RESTAURANT_CATALOG)[number],
  area: AreaContext,
  latitude: number,
  longitude: number,
): SeedLocation => {
  const point = destinationPoint(
    latitude,
    longitude,
    seed.bearingDeg,
    seed.distanceKm,
  );
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    formattedAddress: composeAddress(
      seed.addressLine,
      area,
      point.latitude,
      point.longitude,
    ),
  };
};

const buildCluster = async (latitude: number, longitude: number) => {
  const clusterKey = clusterKeyOf(latitude, longitude);
  await ensureGeoIndexes();
  const [area, pois, existing] = await Promise.all([
    fetchAreaContext(latitude, longitude, clusterKey),
    fetchFoodPois(latitude, longitude, POI_SEARCH_RADIUS_KM).catch(() => []),
    Restaurant.find({ type: "demo", demoClusterKey: clusterKey }, { name: 1 })
      .lean(),
  ]);
  const existingByName = new Map<string, mongoose.Types.ObjectId>(
    existing.map((restaurant) => [restaurant.name, restaurant._id]),
  );

  const locations = selectPoiLocations(
    pois,
    DEMO_RESTAURANT_CATALOG.length,
    latitude,
    longitude,
    area,
  );
  const locationBySeed = new Map(
    DEMO_RESTAURANT_CATALOG.map((seed, index) => [
      seed.name,
      locations[index] ?? null,
    ]),
  );

  const newDocs = DEMO_RESTAURANT_CATALOG.filter(
    (seed) => !existingByName.has(seed.name),
  ).map((seed) => {
    const location =
      locationBySeed.get(seed.name) ??
      fallbackLocation(seed, area, latitude, longitude);
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
        coordinates: [location.longitude, location.latitude],
        formattedAddress: location.formattedAddress,
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
