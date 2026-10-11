import express from "express";
import { isAuth, isRider } from "../middlewares/isAuth.js";
import uploadFile from "../middlewares/multer.js";
import {
  addRiderProfile,
  fetchMyProfile,
  toggleRiderAvailability,
  updateRiderSoundPreference,
  acceptOrder,
  fetchMyCurrentOrder,
  updateOrderStatus,
  publishRiderLocation,
} from "../controllers/rider.js";
import { seedDemoRiders } from "../controllers/demo.js";
const router = express.Router();

router.post("/internal/demo/seed", seedDemoRiders);
router.get("/myprofile", isAuth, isRider, fetchMyProfile);
router.patch("/toggle", isAuth, isRider, toggleRiderAvailability);
router.patch("/sound", isAuth, isRider, updateRiderSoundPreference);
router.post("/new", isAuth, isRider, uploadFile, addRiderProfile);
router.post("/accept/:orderId", isAuth, isRider, acceptOrder);
router.get("/current/order", isAuth, isRider, fetchMyCurrentOrder);
router.put("/order/update/:orderId", isAuth, isRider, updateOrderStatus);
router.post("/location", isAuth, isRider, publishRiderLocation);
export default router;
