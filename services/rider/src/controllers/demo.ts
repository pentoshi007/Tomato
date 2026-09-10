import TryCatch from "../middlewares/trycatch.js";
import { Rider } from "../model/Rider.js";
import { DEMO_RIDER_CATALOG, demoRiderIdentity } from "../config/demoRiders.js";
import { destinationPoint } from "../utils/geo.js";

export const seedDemoRiders = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res
      .status(401)
      .json({ message: "Unauthorized, you are not an internal service" });
  }
  const { clusterKey, latitude, longitude } = req.body as {
    clusterKey?: string;
    latitude?: number;
    longitude?: number;
  };
  if (!clusterKey || typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({ message: "clusterKey, latitude and longitude are required" });
  }

  let seeded = 0;
  for (const [i, seed] of DEMO_RIDER_CATALOG.entries()) {
    const identity = demoRiderIdentity(clusterKey, i);
    const existing = await Rider.findOne({ userId: identity.userId });
    if (existing) continue;
    const point = destinationPoint(latitude, longitude, seed.bearingDeg, seed.distanceKm);
    try {
      await Rider.create({
        ...identity,
        name: seed.name,
        picture: seed.picture,
        isVerified: true,
        isAvailable: false,
        type: "demo",
        demoClusterKey: clusterKey,
        location: {
          type: "Point",
          coordinates: [point.longitude, point.latitude],
        },
      });
      seeded += 1;
    } catch (error) {
      console.log(`demo rider seed skipped for ${seed.name}`, error);
    }
  }

  const total = await Rider.countDocuments({ type: "demo", demoClusterKey: clusterKey });
  return res.status(200).json({ success: true, seeded, total });
});
