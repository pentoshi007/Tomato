import mongoose, { Document, Schema } from "mongoose";

export interface IRestaurant extends Document {
    name: string,
    description?: string,
    image?: string,
    ownerId: string,
    phone:number,
    isVerified:boolean,
    autoLocation:{
        type: "Point",
        // "Point" is a GeoJSON object type used in MongoDB for geospatial queries.
        // It indicates that the "autoLocation" field stores a geographic coordinate as a single point (longitude, latitude).
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
    autoLocation: { type: { type: String, enum: ["Point"], required: true, }, coordinates: { type: [Number], required: true, }, formattedAddress: { type: String, required: true, }, },
    isOpen: { type: Boolean, default: false, },
},{timestamps: true});

schema.index({ autoLocation: "2dsphere" });
// The '2dsphere' index in MongoDB enables efficient geospatial queries on location data stored as GeoJSON objects (like 'Point').
// It allows you to run queries such as finding restaurants within a certain distance or nearby a coordinate.
// By adding schema.index({ autoLocation: "2dsphere" }), we're telling MongoDB to treat the 'autoLocation' field as geographic coordinates on a sphere (the Earth).
// For example: Restaurant.find({ location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 1000 } } })
// Reference: https://www.mongodb.com/docs/manual/geospatial-queries/

const Restaurant = mongoose.model<IRestaurant>("Restaurant", schema);

export default Restaurant;