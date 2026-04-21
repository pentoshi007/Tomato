import TryCatch from "../middlewares/trycatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import Restaurant from "../models/Restaurant.js";
import getBuffer from "../config/datauri.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

export const addRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized, you are not a user" });
      return;
    }
    const existingRestaurant = await Restaurant.findOne({ ownerId: user._id });
    if (existingRestaurant) {
      res.status(400).json({ message: "Restaurant already exists" });
      return;
    }
    const { name, description, latitude, longitude, formattedAddress, phone } =
      req.body;

    if (
      !name ||
      latitude === undefined ||
      longitude === undefined ||
      !formattedAddress ||
      !phone
    ) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "Image is required" });
      return;
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer) {
      res.status(500).json({ message: "Failed to get file buffer" });
      return;
    }

    const { data: uploadResult } = await axios.post(
      `${process.env.UTILS_SERVICE}/api/upload`,
      {
        buffer: fileBuffer.content,
      },
    );

    const restaurant = await Restaurant.create({
      name,
      description,
      phone,
      image: uploadResult.url,
      ownerId: user._id,
      autoLocation: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
        formattedAddress,
      },
      isVerified: false,
    });

    return res
      .status(201)
      .json({ restaurant, message: "Restaurant created successfully" });
  },
);

export const fetchMyRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res
        .status(401)
        .json({ message: "Unauthorized, Please login to continue" });
      return;
    }
    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (!restaurant) {
      res
        .status(404)
        .json({ message: "Restaurant not found, Please add a restaurant" });
      return;
    }
    if (!user.restaurantId) {
      const token = jwt.sign(
        { user: user._id, role: user.role, restaurantId: restaurant._id },
        process.env.JWT_SECRET as string,
        { expiresIn: "15d" },
      );
      return res.status(200).json({ restaurant, token });
    }
    return res
      .status(200)
      .json({ message: "Restaurant fetched successfully", restaurant });
  },
);

export const updateRestaurantStatus = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res
        .status(403)
        .json({ message: "Unauthorized, Please login to continue" });
      return;
    }
    const { status } = req.body;
    if (typeof status !== "boolean") {
      res.status(400).json({ message: "Status must be a boolean" });
      return;
    }
    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerId: user._id },
      { isOpen: status },
      { returnDocument: "after" },
    );
    if (!restaurant) {
      res
        .status(404)
        .json({ message: "Restaurant not found, Please add a restaurant" });
      return;
    }
    return res
      .status(200)
      .json({ message: "Restaurant status updated successfully", restaurant });
  },
);

export const updateRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res
        .status(403)
        .json({ message: "Unauthorized, Please login to continue" });
      return;
    }
    const { name, description } = req.body;
    if (!name || !description) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerId: user._id },
      { name, description },
      { returnDocument: "after" },
    );
    if (!restaurant) {
      res
        .status(404)
        .json({ message: "Restaurant not found, Please add a restaurant" });
      return;
    }
    return res
      .status(200)
      .json({ message: "Restaurant updated successfully", restaurant });
  },
);

export const getNearbyRestaurants = TryCatch(
  async (req: Request, res: Response) => {
    const { latitude, longitude, radius = 5000, search = "" } = req.query;
    if (!latitude || !longitude) {
      res.status(400).json({ message: "Latitude and longitude are required" });
      return;
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    const radiusInMeters = Number(radius);
    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      Number.isNaN(radiusInMeters)
    ) {
      res.status(400).json({ message: "Invalid latitude or longitude" });
      return;
    }
    const query: any = {
      isVerified: true,
    };
    if (search && typeof search === "string") {
      query.name = { $regex: search, $options: "i" };
    }
    query.autoLocation = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: radiusInMeters > 0 ? radiusInMeters : 5000,
      },
    };

    const restaurants = await Restaurant.find(query).sort({ isOpen: -1 });

    res.status(200).json({
      success: true,
      restaurants,
      count: restaurants.length,
    });
  },
);

export const fetchSingleRestaurant = TryCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "Restaurant ID is required" });
      return;
    }
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }
    return res.status(200).json({ success: true, restaurant });
  },
);
