import axios from "axios";
import { Response } from "express";
import { getRazorpay } from "../config/razorpay.js";
import { verifyRazorpaySignature } from "../config/verifyRazorpay.js";
import { publishPaymentSuccess } from "../config/payment.producer.js";
import dotenv from "dotenv";
import Stripe from "stripe";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type PaymentOrder = {
  success: boolean;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
};

const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object" && "message" in data) {
      return String((data as { message: string }).message);
    }
    return err.message;
  }
  if (err && typeof err === "object" && "error" in err) {
    const razorpayError = (err as { error?: { description?: string } }).error;
    if (razorpayError?.description) return razorpayError.description;
  }
  return err instanceof Error ? err.message : "Unknown error";
};

const fetchPaymentOrder = async (
  orderId: string,
  verification = false,
): Promise<PaymentOrder> => {
  if (!process.env.INTERNAL_SERVICE_KEY || !process.env.RESTAURANT_SERVICE_URL) {
    throw new Error("Payment service is not configured");
  }
  const { data } = await axios.get<PaymentOrder>(
    `${process.env.RESTAURANT_SERVICE_URL}/api/order/payment/${
      verification ? "verify/" : ""
    }${orderId}`,
    { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
  );
  return data;
};

const validateOrderRequest = (
  req: AuthenticatedRequest,
  res: Response,
  orderId: unknown,
): orderId is string => {
  if (typeof orderId !== "string" || orderId.length === 0) {
    res.status(400).json({ success: false, message: "Order ID is required" });
    return false;
  }
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return true;
};

export const createRazorpayOrder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!validateOrderRequest(req, res, req.body.orderId)) return;
  try {
    const order = await fetchPaymentOrder(req.body.orderId as string);
    if (String(order.userId) !== req.user?._id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const amountInPaise = Math.round(order.amount * 100);
    const razorpayOrder = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: order.currency,
      receipt: String(req.body.orderId),
    });
    return res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (err) {
    console.error("createRazorpayOrder error:", getErrorMessage(err));
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
};

export const verifyRazorpayPayment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!validateOrderRequest(req, res, req.body.orderId)) return;
  const { orderId, razorpay_payment_id, razorpay_signature, razorpay_order_id } =
    req.body;
  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return res
      .status(400)
      .json({ message: "Missing payment verification fields" });
  }
  try {
    if (!verifyRazorpaySignature(
      razorpay_signature,
      razorpay_order_id,
      razorpay_payment_id,
    )) {
      return res.status(400).json({ message: "Payment verification failed" });
    }
    const razorpayOrder = await getRazorpay().orders.fetch(razorpay_order_id);
    if (String(razorpayOrder.receipt) !== String(orderId)) {
      return res.status(400).json({ message: "Payment does not match this order" });
    }
    if (razorpayOrder.status !== "paid") {
      return res.status(400).json({ message: "Payment not captured" });
    }
    const order = await fetchPaymentOrder(String(orderId), true);
    if (String(order.userId) !== req.user?._id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await publishPaymentSuccess({
      orderId,
      paymentId: razorpay_payment_id,
      provider: "razorpay",
    });
    return res.status(200).json({ message: "Payment verified successfully" });
  } catch {
    return res.status(500).json({ message: "Failed to verify Razorpay payment" });
  }
};

export const payWithStripe = async (req: AuthenticatedRequest, res: Response) => {
  if (!validateOrderRequest(req, res, req.body.orderId)) return;
  try {
    const order = await fetchPaymentOrder(req.body.orderId as string);
    if (String(order.userId) !== req.user?._id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: order.currency.toLowerCase(),
            product_data: { name: "Payment for your order" },
            unit_amount: Math.round(order.amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: String(req.body.orderId) },
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout`,
    });
    return res.json({ url: session.url });
  } catch {
    return res.status(500).json({ message: "Failed to pay with Stripe" });
  }
};

export const verifyStripePayment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const sessionId = req.query.session_id;
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return res.status(400).json({ message: "Session ID is required" });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;
    if (
      !orderId ||
      session.payment_status !== "paid" ||
      session.status !== "complete" ||
      typeof session.amount_total !== "number"
    ) {
      return res.status(402).json({ message: "Payment is not complete" });
    }
    const order = await fetchPaymentOrder(orderId, true);
    if (
      String(order.userId) !== req.user?._id ||
      session.amount_total !== Math.round(order.amount * 100)
    ) {
      return res.status(403).json({ message: "Payment does not match this order" });
    }
    if (typeof session.payment_intent !== "string") {
      return res.status(402).json({ message: "Payment is not complete" });
    }
    await publishPaymentSuccess({
      orderId,
      paymentId: session.payment_intent,
      provider: "stripe",
    });
    return res
      .status(200)
      .json({ message: "Payment verified successfully", orderId });
  } catch {
    return res.status(500).json({
      message: "Failed to verify Stripe payment",
    });
  }
};
