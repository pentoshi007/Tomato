import { Router } from "express";
import { createOrder, fetchOrderForPayment, fetchRestaurantOrders, updateOrderStatus,fetchSingleOrder, getMyOrders } from "../controllers/order.js";
import { isAuth, isSeller } from "../middlewares/isAuth.js";

const router = Router();

router.post("/new", isAuth, createOrder);
router.get("/payment/:orderId", fetchOrderForPayment);
router.get("/:restaurantId", isAuth,isSeller, fetchRestaurantOrders);
router.put("/:orderId",isAuth,isSeller, updateOrderStatus);
router.get("/my", isAuth,getMyOrders);
router.get("/:id", isAuth, fetchSingleOrder);

export default router;
