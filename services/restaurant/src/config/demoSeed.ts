import axios from "axios";
import Restaurant from "../models/Restaurant.js";
import MenuItems from "../models/MenuItems.js";
import { DEMO_RESTAURANT_CATALOG } from "./demoCatalog.js";
import { destinationPoint } from "../utils/geo.js";

const CLUSTER_DEDUPE_KM = 8;

type AreaContext = { city: string | null; suburb: string | null };

const fetchAreaContext = async (
  latitude: number,
  longitude: number,
): Promise<AreaContext> => {
  try {
    const { data } = await axios.get(
      `${process.env.UTILS_SERVICE}/api/geocode/reverse`,
      {
        params: { lat: latitude, lon: longitude },
        timeout: 5000,
      },
    );
    const address = data?.address ?? {};
    return {
      city:
        address.city ||
        address.town ||
        address.village ||
        address.state_district ||
        null,
      suburb: address.suburb || address.neighbourhood || address.quarter || null,
    };
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

const seedRidersForCluster = async (
  clusterKey: string,
  latitude: number,
  longitude: number,
  area: AreaContext,
) => {
  const riderServiceUrl = process.env.RIDER_SERVICE_URL;
  if (!riderServiceUrl) return;
  await axios.post(
    `${riderServiceUrl}/api/rider/internal/demo/seed`,
    {
      clusterKey,
      latitude,
      longitude,
      city: area.city,
      suburb: area.suburb,
    },
    {
      headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "" },
      timeout: 8000,
    },
  );
};

const buildCluster = async (latitude: number, longitude: number) => {
  const area = await fetchAreaContext(latitude, longitude);
  const clusterKey = clusterKeyOf(latitude, longitude);
  for (const seed of DEMO_RESTAURANT_CATALOG) {
    const point = destinationPoint(
      latitude,
      longitude,
      seed.bearingDeg,
      seed.distanceKm,
    );
    const existing = await Restaurant.findOne({
      type: "demo",
      demoClusterKey: clusterKey,
      name: seed.name,
    }).lean();
    if (existing) continue;
    try {
      const restaurant = await Restaurant.create({
        name: seed.name,
        description: seed.description,
        image: seed.image,
        phone: seed.phone,
        ownerId: `demo:${clusterKey}`,
        isVerified: true,
        isOpen: true,
        type: "demo",
        demoClusterKey: clusterKey,
        autoLocation: {
          type: "Point",
          coordinates: [point.longitude, point.latitude],
          formattedAddress: composeAddress(
            seed.addressLine,
            area,
            point.latitude,
            point.longitude,
          ),
        },
      });
      await MenuItems.insertMany(
        seed.menu.map((item) => ({
          ...item,
          restaurantId: restaurant._id,
          isAvailable: true,
          type: "demo",
          demoClusterKey: clusterKey,
        })),
      );
    } catch (error) {
      console.log(`demo seed skipped for ${seed.name}`, error);
    }
  }
  try {
    await seedRidersForCluster(clusterKey, latitude, longitude, area);
  } catch (error) {
    console.log("demo rider seeding skipped", error);
  }
};

const inFlightSeeds = new Map<string, Promise<void>>();

export const seedDemoCluster = async (
  latitude: number,
  longitude: number,
): Promise<void> => {
  const nearbyDemo = await Restaurant.findOne({
    type: "demo",
    autoLocation: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: CLUSTER_DEDUPE_KM * 1000,
      },
    },
  }).lean();
  if (nearbyDemo) return;

  const clusterKey = clusterKeyOf(latitude, longitude);
  const pending = inFlightSeeds.get(clusterKey);
  if (pending) {
    await pending.catch(() => undefined);
    return;
  }
  const task = buildCluster(latitude, longitude).finally(() =>
    inFlightSeeds.delete(clusterKey),
  );
  inFlightSeeds.set(clusterKey, task);
  await task.catch(() => undefined);
};
