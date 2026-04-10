import TryCatch from "../middlewares/trycatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import Restaurant from "../models/Restaurant.js";
import getBuffer from "../config/datauri.js";
import axios from "axios";

import { Response } from "express";

export const addRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized, you are not a user" });
      return;
    }
    const existingRestaurant = await Restaurant.findOne({ ownerId: user?._id });
    if (existingRestaurant) {
      res.status(400).json({ message: "Restaurant already exists" });
      return;
    }
    const { name, description, latitude, longitude, formattedAddress, phone } =
      req.body;

    if (!name || !latitude || !longitude || !formattedAddress || !phone) {
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
      ownerId: user?._id,
      autoLocation: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
        formattedAddress,
      },
    });

    return res
      .status(201)
      .json({ restaurant, message: "Restaurant created successfully" });
  },
);
