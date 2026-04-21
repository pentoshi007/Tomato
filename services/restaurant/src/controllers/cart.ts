import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Cart from "../models/cart.js";
import type { ICart } from "../models/cart.js";
import MenuItems from "../models/MenuItems.js";

const CartModel = Cart as mongoose.Model<ICart>;

export const addToCart = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized, Please Login" });
      return;
    }

    const userId = user._id;
    const { restaurantId, itemId } = req.body as {
      restaurantId: string;
      itemId: string;
    };

    if (
      !mongoose.Types.ObjectId.isValid(restaurantId) ||
      !mongoose.Types.ObjectId.isValid(itemId)
    ) {
      res.status(400).json({ message: "Invalid restaurant or item ID" });
      return;
    }

    const item = await (MenuItems as any).findOne({
      _id: itemId,
      restaurantId,
    });
    if (!item) {
      res.status(404).json({ message: "Item not found for this restaurant" });
      return;
    }
    if (!item.isAvailable) {
      res.status(400).json({ message: "Item is currently unavailable" });
      return;
    }

    const cartFromDifferentRestaurant = await CartModel.findOne({
      userId,
      restaurantId: { $ne: restaurantId },
    });
    if (cartFromDifferentRestaurant) {
      res.status(400).json({
        message:
          "You already have items from a different restaurant. Please clear your cart before adding items from another restaurant.",
      });
      return;
    }

    const cartItem = await CartModel.findOneAndUpdate(
      { userId, restaurantId, itemId },
      {
        $inc: { quantity: 1 },
        $setOnInsert: { userId, restaurantId, itemId },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(200).json({
      message: "Item added to cart",
      cart: cartItem,
    });
  },
);

export const fetchMyCart = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized, Please Login" });
      return;
    }
    const cartItems = await CartModel.find({ userId: user._id })
      .populate("itemId")
      .populate("restaurantId");

    let totalPrice = 0;
    let cartLength = 0;
    for (const item of cartItems) {
      const menuItem = item.itemId as unknown as { price: number } | null;
      if (menuItem && typeof menuItem.price === "number") {
        totalPrice += menuItem.price * item.quantity;
      }
      cartLength += item.quantity;
    }

    res.status(200).json({
      message: "Cart fetched successfully",
      cart: cartItems,
      totalPrice,
      cartLength,
    });
  },
);
