import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import uploadFile from "../middlewares/multer.js";
import {
  addRiderProfile,
  fetchMyProfile,
  toggleRiderAvailability,
  updateRiderSoundPreference,
  acceptOrder,
  fetchMyCurrentOrder,
  updateOrderStatus,
} from "../controllers/rider.js";
import { seedDemoRiders } from "../controllers/demo.js";
const router = express.Router();

router.post("/internal/demo/seed", seedDemoRiders);
router.get("/myprofile", isAuth, fetchMyProfile);
router.patch("/toggle", isAuth, toggleRiderAvailability);
router.patch("/sound", isAuth, updateRiderSoundPreference);
router.post("/new", isAuth, uploadFile, addRiderProfile);
router.post("/accept/:orderId", isAuth, acceptOrder);
router.get("/current/order", isAuth, fetchMyCurrentOrder);
router.put("/order/update/:orderId", isAuth, updateOrderStatus);
export default router;
