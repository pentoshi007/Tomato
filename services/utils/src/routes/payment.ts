import { Router } from "express";
import {
  createRazorpayOrder,
  payWithStripe,
  verifyRazorpayPayment,
  verifyStripePayment,
} from "../controllers/payment.js";

const router = Router();

router.post("/create", createRazorpayOrder);
router.post("/verify", verifyRazorpayPayment);
router.post("/stripe/create", payWithStripe);
router.get("/stripe/verify", verifyStripePayment);
export default router;
