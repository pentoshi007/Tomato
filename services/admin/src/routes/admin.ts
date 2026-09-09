import { Router } from "express";
import {
  getPendingRiders,
  getPendingRestaurants,
  verifyRestaurant,
  verifyRider,
} from "../controllers/admin.js";
import { isAdmin, isAuth } from "../middlewares/isAuth.js";

const router = Router();

router.use(isAuth, isAdmin);
router.get("/admin/restaurants/pending", getPendingRestaurants);
router.get("/admin/riders/pending", getPendingRiders);
router.patch("/verify/restaurant/:id", verifyRestaurant);
router.patch("/verify/rider/:id", verifyRider);

export default router;
