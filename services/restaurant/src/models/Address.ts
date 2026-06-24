import mongoose, { Schema, Document, ProjectionType } from "mongoose";

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  formattedAddress: string;
  mobile: number;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    formattedAddress: { type: String, required: true },
    mobile: { type: Number, required: true },
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
  },
  { timestamps: true },
);

addressSchema.index({ location: "2dsphere" });

const Address = mongoose.model<IAddress>("Address", addressSchema);

export default Address;
