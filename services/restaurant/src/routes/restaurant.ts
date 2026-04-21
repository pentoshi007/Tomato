import { Router } from "express";
import {
  addRestaurant,
  fetchMyRestaurant,
  updateRestaurant,
  updateRestaurantStatus,
  getNearbyRestaurants,
  fetchSingleRestaurant,
} from "../controllers/restaurant.js";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import uploadFile from "../middlewares/multer.js";

const router = Router();

router.post("/new", isAuth, isSeller, uploadFile, addRestaurant);
router.get("/my", isAuth, isSeller, fetchMyRestaurant);
router.put("/status", isAuth, isSeller, updateRestaurantStatus);
router.put("/edit", isAuth, isSeller, updateRestaurant);
router.get("/nearby", isAuth, getNearbyRestaurants);
router.get("/:id", isAuth, fetchSingleRestaurant);
export default router;
