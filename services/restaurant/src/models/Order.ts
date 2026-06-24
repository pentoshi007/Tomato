import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  restaurantName: string;
  riderId: mongoose.Types.ObjectId | null;
  riderPhone: number | null;
  riderName: string | null;
  distance: number;
  riderAmount: number;

  items: {
    itemId: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
  }[];
  subTotal: number;
  deliveryFee: number;
  platformFee: number;
  totalAmount: number;
  addressId: mongoose.Types.ObjectId;
  deliveryAddress: {
    formattedAddress: string;
    mobile: number;
    latitude: number;
    longitude: number;
  };
  status:
    | "placed"
    | "accepted"
    | "preparing"
    | "ready_for_rider"
    | "rider_assigned"
    | "picked_up"
    | "delivered"
    | "cancelled";

  paymentMethod: "razorpay" | "stripe";
  paymentStatus: "pending" | "paid" | "failed";
  paymentId: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    restaurantName: { type: String, required: true },
    riderId: { type: Schema.Types.ObjectId, ref: "Rider", default: null },
    riderPhone: { type: Number, default: null },
    riderName: { type: String, default: null },
    distance: { type: Number, required: true },
    riderAmount: { type: Number, required: true },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    subTotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    addressId: { type: Schema.Types.ObjectId, ref: "Address", required: true },
    deliveryAddress: {
      formattedAddress: { type: String, required: true },
      mobile: { type: Number, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    status: {
      type: String,
      required: true,
      enum: [
        "placed",
        "accepted",
        "preparing",
        "ready_for_rider",
        "rider_assigned",
        "picked_up",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["razorpay", "stripe"],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentId: { type: String, default: null },
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true },
);

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
