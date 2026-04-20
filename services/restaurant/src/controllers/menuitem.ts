import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import { Response } from "express";
import Restaurant from "../models/Restaurant.js";
import axios from "axios";
import getBuffer from "../config/datauri.js";
import MenuItems from "../models/MenuItems.js";
import mongoose from "mongoose";

export const addMenuItem = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized, you are not a user" });
      return;
    }
    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }
    const { name, description, price } = req.body;
    if (!name || !description || !price) {
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
    const item = await MenuItems.create({
      name,
      description,
      price,
      image: uploadResult.url,
      restaurantId: restaurant._id as unknown as mongoose.Schema.Types.ObjectId,
    });
    return res
      .status(201)
      .json({ item, message: "MenuItem created successfully" });
  },
);
export const getAllItems = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "Restaurant ID is required" });
      return;
    }
    const items = await MenuItems.find({
      restaurantId: id as unknown as mongoose.Schema.Types.ObjectId,
    });
    return res
      .status(200)
      .json({ items, message: "MenuItems fetched successfully" });
  },
);
