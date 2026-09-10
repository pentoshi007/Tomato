import { Router } from "express";
import {
  createOrder,
  fetchOrderForPayment,
  fetchRestaurantOrders,
  updateOrderStatus,
  fetchSingleOrder,
  getMyOrders,
  assignRiderToOrder,
  getCurrentOrdersForRider,
  updateOrderStatusRider,
  fetchPreviousDemoRider,
  persistOrderRoute,
} from "../controllers/order.js";
import { isAuth, isSeller } from "../middlewares/isAuth.js";

const router = Router();

router.post("/new", isAuth, createOrder);
router.put("/route", persistOrderRoute);
router.get("/my", isAuth, getMyOrders);
router.get("/payment/:orderId", fetchOrderForPayment);
router.get(
  "/restaurant/:restaurantId",
  isAuth,
  isSeller,
  fetchRestaurantOrders,
);
router.get("/:orderId", isAuth, fetchSingleOrder);
router.put("/:orderId", isAuth, isSeller, updateOrderStatus);
router.put("/assign/rider", assignRiderToOrder);
router.get("/current/rider", getCurrentOrdersForRider);
router.put("/update/status/rider", updateOrderStatusRider);
router.get("/demo/previous-rider", fetchPreviousDemoRider);

export default router;
