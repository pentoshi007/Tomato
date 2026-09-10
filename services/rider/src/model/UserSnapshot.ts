import mongoose, { Schema, Document } from "mongoose";

export interface IUserSnapshot extends Document {
  email: string;
  name: string;
  image: string;
  role: string;
}

const userSnapshotSchema = new Schema<IUserSnapshot>({
  email: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  role: { type: String, default: null },
});

export const UserSnapshot = mongoose.model<IUserSnapshot>(
  "User",
  userSnapshotSchema,
  "users",
);
