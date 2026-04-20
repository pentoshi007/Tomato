import mongoose, { Document, Schema } from "mongoose";

export interface IMenuItems extends Document {
  name: string;
  description: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  restaurantId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const menuSchema = new Schema<IMenuItems>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: false },
    isAvailable: { type: Boolean, default: true },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Restaurant",
      index: true,
    },
  },
  { timestamps: true },
);

const MenuItems = mongoose.model<IMenuItems>("MenuItem", menuSchema);

export default MenuItems;
