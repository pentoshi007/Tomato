import mongoose, { Document, Schema } from "mongoose";

export interface IRestaurant extends Document {
    name: string,
    description?: string,
    image?: string,
    ownerId: string,
    phone:number,
    isVerified:boolean,
    soundEnabled:boolean,
    type: "normal" | "demo",
    demoClusterKey?: string,
    autoLocation:{
        type: "Point",
        coordinates: [number, number],
        formattedAddress: string,
    };
    isOpen:boolean,
    createdAt:Date,


}

const schema = new Schema<IRestaurant>({
    name: { type: String, required: true, trim: true, },
    description: { type: String, trim: true, },
    image: { type: String, trim: true, required: true, },
    ownerId: { type: String, required: true, },
    phone: { type: Number, required: true, },
    isVerified: { type: Boolean, default: false, required: true, },
    soundEnabled: { type: Boolean, default: false, },
    type: { type: String, enum: ["normal", "demo"], default: "normal", },
    demoClusterKey: { type: String, },
    autoLocation: { type: { type: String, enum: ["Point"], required: true, }, coordinates: { type: [Number], required: true, }, formattedAddress: { type: String, required: true, }, },
    isOpen: { type: Boolean, default: false, },
},{timestamps: true});

schema.index({ autoLocation: "2dsphere" });
schema.index(
    { demoClusterKey: 1, name: 1 },
    { unique: true, partialFilterExpression: { type: "demo" } },
);


const Restaurant = mongoose.model<IRestaurant>("Restaurant", schema);

export default Restaurant;