import TryCatch from "../middlewares/trycatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import Restaurant from "../models/Restaurant.js";
import getBuffer from "../config/datauri.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import { Response } from "express";

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
      { returnDocument: 'after' },
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
      { returnDocument: 'after' },
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
