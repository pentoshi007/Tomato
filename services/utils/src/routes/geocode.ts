import express from "express";
import { reverseGeocodeHandler } from "../controllers/geocode.js";

const router = express.Router();

router.get("/reverse", reverseGeocodeHandler);

export default router;
