import TryCatch from "../middlewares/trycatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";

import axios from "axios";
import { Rider } from "../model/Rider.js";
import { UserSnapshot } from "../model/UserSnapshot.js";
import getBuffer from "../config/datauri.js";

export const addRiderProfile = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.role !== "rider") {
      return res
        .status(403)
        .json({ message: "Only riders can create rider profiles" });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Rider image is required" });
    }
    const fileBuffer = getBuffer(file);
    if (!fileBuffer || !fileBuffer.content) {
      return res.status(500).json({ message: "Failed to get file buffer" });
    }
    const uploadResult = await axios.post(
      `${process.env.UTILS_SERVICE}/api/upload`,
      {
        buffer: fileBuffer.content,
      },
    );
    const {
      phoneNumber,
      aadharNumber,
      drivingLicenseNumber,
      latitude,
      longitude,
    } = req.body;

    if (
      !phoneNumber ||
      !aadharNumber ||
      !drivingLicenseNumber ||
      !latitude ||
      !longitude
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingProfile = await Rider.findOne({ userId: user._id });
    if (existingProfile) {
      return res.status(400).json({ message: "Rider profile already exists" });
    }
    const usedPhoneNumber = await Rider.findOne({ phoneNumber });
    if (usedPhoneNumber) {
      return res.status(400).json({ message: "Phone number already in use" });
    }
    const riderProfile = new Rider({
      userId: user._id,
      picture: uploadResult.data.url,
      phoneNumber,
      aadharNumber,
      drivingLicenseNumber,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      isAvailable: false,
      isVerified: false,
    });

    await riderProfile.save();
    res.status(201).json({ message: "Rider profile created successfully" });
  },
);
export const fetchMyProfile = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const profile = await Rider.findOne({ userId: user._id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json(profile);
  },
);

const getActiveOrderForRider = async (riderId: string) => {
  try {
    const { data } = await axios.get(
      `${process.env.RESTAURANT_SERVICE}/api/order/current/rider?riderId=${riderId}`,
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );
    return data.order ?? data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const toggleRiderAvailability = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.role !== "rider") {
      return res
        .status(403)
        .json({ message: "Only riders can toggle availability" });
    }
    const { isAvailable, latitude, longitude } = req.body;
    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({ message: "isAvailable must be a boolean" });
    }
    if (latitude && longitude) {
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res
          .status(400)
          .json({ message: "latitude and longitude must be numbers" });
      }
    }

    const rider = await Rider.findOne({ userId: user._id });
    if (!rider) {
      return res.status(404).json({ message: "Profile not found" });
    }
    if (isAvailable && !rider.isVerified) {
      return res
        .status(400)
        .json({ message: "Rider must be verified to be available" });
    }

    if (isAvailable) {
      try {
        const activeOrder = await getActiveOrderForRider(rider._id.toString());
        if (activeOrder) {
          return res.status(409).json({
            message: "Complete your current order before going online",
          });
        }
      } catch (error) {
        console.error("Failed to verify rider active order:", error);
        return res.status(503).json({
          message: "Unable to verify current order status. Please try again.",
        });
      }
    }

    rider.isAvailable = isAvailable;
    if (latitude && longitude) {
      rider.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }
    rider.lastActiveAt = new Date();
    await rider.save();
    res.status(200).json({
      message: isAvailable ? "Rider is now Online" : "Rider is now offline",
      rider,
    });
  },
);

export const updateRiderSoundPreference = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.role !== "rider") {
      return res
        .status(403)
        .json({ message: "Only riders can update sound preferences" });
    }

    const { soundEnabled } = req.body;
    if (typeof soundEnabled !== "boolean") {
      return res
        .status(400)
        .json({ message: "soundEnabled must be a boolean" });
    }

    const rider = await Rider.findOneAndUpdate(
      { userId: user._id },
      { soundEnabled },
      { new: true },
    );
    if (!rider) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.status(200).json({
      message: soundEnabled ? "Sound enabled" : "Sound disabled",
      soundEnabled: rider.soundEnabled,
      rider,
    });
  },
);

export const acceptOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
  const riderUserId = req.user?._id;
  const { orderId } = req.params;
  if (!riderUserId || !orderId) {
    return res.status(400).json({ message: "Please Log In and try again" });
  }
  // Atomic claim: flip available -> busy in one operation so two
  // concurrent accepts cannot both win. Only the winner proceeds.
  const rider = await Rider.findOneAndUpdate(
    { userId: riderUserId, isAvailable: true },
    { isAvailable: false },
    { new: true },
  );
  if (!rider) {
    const profile = await Rider.findOne({ userId: riderUserId });
    if (!profile) {
      return res.status(404).json({ message: "Rider profile not found" });
    }
    return res
      .status(400)
      .json({ message: "Rider is offline or already has an active order" });
  }
  const releaseClaim = () =>
    Rider.updateOne({ _id: rider._id }, { isAvailable: true });
  try {
    const account = await UserSnapshot.findById(riderUserId).lean();
    const riderName =
      account?.name || rider.name || `Rider ${rider.phoneNumber.slice(-4)}`;
    const { data } = await axios.put(
      `${process.env.RESTAURANT_SERVICE}/api/order/assign/rider`,
      {
        orderId,
        riderId: rider._id.toString(),
        riderUserId: riderUserId.toString(),
        riderName,
        riderPhone: rider.phoneNumber,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );
    if (data.success) {
      return res
        .status(200)
        .json({ message: "Order accepted successfully", riderDetails: rider });
    }
    await releaseClaim();
  } catch (error) {
    await releaseClaim();
    const status =
      axios.isAxiosError(error) && error.response?.status
        ? error.response.status
        : 400;
    const message =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Failed to accept order";
    return res.status(status).json({ message });
  }
  return res.status(400).json({ message: "Failed to accept order" });
});

export const fetchMyCurrentOrder = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const riderUserId = req.user?._id;
    if (!riderUserId) {
      return res.status(400).json({ message: "Please Log In and try again" });
    }
    const rider = await Rider.findOne({ userId: riderUserId });
    if (!rider) {
      return res.status(404).json({ message: "Rider profile not found" });
    }
    try {
      const { data } = await axios.get(
        `${process.env.RESTAURANT_SERVICE}/api/order/current/rider?riderId=${rider._id.toString()}`,
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        },
      );
      res.json({
        order: data.order ?? data,
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return res.status(404).json({ message: "No active order assigned" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);
export const updateOrderStatus = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const riderUserId = req.user?._id;
    if (!riderUserId) {
      return res.status(400).json({ message: "Please Log In and try again" });
    }
    const rider = await Rider.findOne({
      userId: riderUserId,
      isAvailable: false,
    });
    if (!rider) {
      return res
        .status(400)
        .json({ message: "Rider is not found or not available" });
    }
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }
    try {
      const { data } = await axios.put(
        `${process.env.RESTAURANT_SERVICE}/api/order/update/status/rider`,
        {
          orderId,
          riderId: rider._id.toString(),
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        },
      );
      res.json({
        message: "Order status updated successfully",
        order: data,
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);
