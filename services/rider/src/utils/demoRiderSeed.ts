import { Rider } from "../model/Rider.js";
import { DEMO_RIDER_CATALOG, demoRiderIdentity } from "../config/demoRiders.js";
import { destinationPoint } from "./geo.js";
import { ensureGeoIndexes } from "./geoIndex.js";

export const ensureDemoRiders = async (
  clusterKey: string,
  latitude: number,
  longitude: number,
): Promise<number> => {
  await ensureGeoIndexes();
  const existing = await Rider.find(
    { type: "demo", demoClusterKey: clusterKey },
    { userId: 1 },
  ).lean();
  if (existing.length >= DEMO_RIDER_CATALOG.length) return 0;

  const known = new Set(existing.map((rider) => rider.userId));
  const docs = DEMO_RIDER_CATALOG.map((seed, index) => {
    const identity = demoRiderIdentity(clusterKey, index);
    if (known.has(identity.userId)) return null;
    const point = destinationPoint(
      latitude,
      longitude,
      seed.bearingDeg,
      seed.distanceKm,
    );
    return {
      ...identity,
      name: seed.name,
      picture: seed.picture,
      isVerified: true,
      isAvailable: false,
      type: "demo" as const,
      demoClusterKey: clusterKey,
      location: {
        type: "Point" as const,
        coordinates: [point.longitude, point.latitude],
      },
    };
  }).filter((doc): doc is NonNullable<typeof doc> => doc !== null);
  if (docs.length === 0) return 0;

  try {
    await Rider.insertMany(docs, { ordered: false });
  } catch (error) {
    console.log("demo rider insert skipped", error);
  }
  return docs.length;
};
