import { ObjectId } from "mongodb";
import TryCatch from "../middlewares/trycatch.js";
import {
  getRestaurantCollection,
  getRiderCollection,
} from "../utils/collections.js";

export const getPendingRestaurants = TryCatch(async (_req, res) => {
  const restaurants = await (await getRestaurantCollection())
    .find({ isVerified: false })
    .toArray();

  return res.json({ count: restaurants.length, restaurants });
});

export const getPendingRiders = TryCatch(async (_req, res) => {
  const riders = await (await getRiderCollection())
    .find({ isVerified: false })
    .toArray();

  return res.json({ count: riders.length, riders });
});

export const verifyRestaurant = TryCatch(async (req, res) => {
  const { id } = req.params;
  if (typeof id !== "string" || !ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid restaurant ID" });
  }

  const restaurants = await getRestaurantCollection();
  const result = await restaurants.updateOne(
    { _id: new ObjectId(id) },
    { $set: { isVerified: true, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  return res.json({ message: "Restaurant verified successfully" });
});

export const verifyRider = TryCatch(async (req, res) => {
  const { id } = req.params;
  if (typeof id !== "string" || !ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid rider ID" });
  }

  const riders = await getRiderCollection();
  const result = await riders.updateOne(
    { _id: new ObjectId(id) },
    { $set: { isVerified: true, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: "Rider not found" });
  }

  return res.json({ message: "Rider verified successfully" });
});
