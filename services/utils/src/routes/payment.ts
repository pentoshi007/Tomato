import { Router } from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  createRazorpayOrder,
  payWithStripe,
  verifyRazorpayPayment,
  verifyStripePayment,
} from "../controllers/payment.js";

const router = Router();

router.post("/create", isAuth, createRazorpayOrder);
router.post("/verify", isAuth, verifyRazorpayPayment);
router.post("/stripe/create", isAuth, payWithStripe);
router.get("/stripe/verify", isAuth, verifyStripePayment);
export default router;
