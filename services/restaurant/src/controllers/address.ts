import TryCatch from "../middlewares/trycatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import Address from "../models/Address.js";
import { Request, Response } from "express";

export const addAddress = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized, you are not a user" });
      return;
    }
    const { formattedAddress, mobile, latitude, longitude } = req.body;
    if (!formattedAddress || !mobile || !latitude || !longitude) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    const address = await Address.create({
      userId: user._id,
      formattedAddress,
      mobile,
      location: { type: "Point", coordinates: [longitude, latitude] },
    });

    return res
      .status(201)
      .json({ address, message: "Address added successfully" });
  },
);
export const deleteAddress = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized, you are not a user" });
      return;
    }
    const { addressId } = req.params;
    if (!addressId) {
      res.status(400).json({ message: "Address ID is required" });
      return;
    }
    const address = await Address.findOneAndDelete({
      userId: user._id,
      _id: addressId,
    });
    if (!address) {
      res.status(404).json({
        message:
          "Address not found or you are not authorized to delete this address",
      });
      return;
    }
    return res
      .status(200)
      .json({ address, message: "Address deleted successfully" });
  },
);
export const getAddresses = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized, you are not a user" });

      return;
    }
    const addresses = await Address.find({ userId: user._id });
    return res
      .status(200)
      .json({ addresses, message: "Addresses fetched successfully" });
  },
);
