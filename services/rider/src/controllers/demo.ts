import TryCatch from "../middlewares/trycatch.js";
import { Rider } from "../model/Rider.js";
import { ensureDemoRiders } from "../utils/demoRiderSeed.js";

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

  const seeded = await ensureDemoRiders(clusterKey, latitude, longitude);
  const total = await Rider.countDocuments({ type: "demo", demoClusterKey: clusterKey });
  return res.status(200).json({ success: true, seeded, total });
});
