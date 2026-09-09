import mongoose, { Schema, Document } from "mongoose";

interface IRider extends Document {
  userId: string;

  picture: string;
  phoneNumber: string;
  aadharNumber: string;
  drivingLicenseNumber: string;
  isVerified: boolean;
  soundEnabled: boolean;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  isAvailable: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RiderSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    picture: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    aadharNumber: { type: String, required: true, unique: true },
    drivingLicenseNumber: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
    soundEnabled: { type: Boolean, default: false },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    isAvailable: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

RiderSchema.index({ location: "2dsphere" });

export const Rider = mongoose.model<IRider>("Rider", RiderSchema);
