import mongoose, { Document, Schema } from "mongoose";

export interface IMenuItems extends Document {
  name: string;
  description: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  type: "normal" | "demo";
  demoClusterKey?: string;
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
    type: { type: String, enum: ["normal", "demo"], default: "normal" },
    demoClusterKey: { type: String },
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
