import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  image: string;
  role: string;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  role: { type: String, default: null },
},{timestamps: true});

const User = mongoose.model<IUser>("User", userSchema);

export default User;