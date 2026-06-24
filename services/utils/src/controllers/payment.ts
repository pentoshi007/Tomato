import axios from "axios";
import { Request, Response } from "express";
import { getRazorpay } from "../config/razorpay.js";
import { verifyRazorpaySignature } from "../config/verifyRazorpay.js";
import { publishPaymentSuccess } from "../config/payment.producer.js";

import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";

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
    const razorpayErr = (err as { error?: { description?: string } }).error;
    if (razorpayErr?.description) return razorpayErr.description;
  }
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
};

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID is required" });
    }

    const { data } = await axios.get(
      `${process.env.RESTAURANT_SERVICE_URL}/api/order/payment/${orderId}`,
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    const amountInPaise = Math.round(data.amount * 100);
    const razorpayOrder = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: data.currency,
      receipt: String(orderId),
    });

    return res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
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
      error: getErrorMessage(err),
    });
  }
};

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_order_id,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res
        .status(400)
        .json({ message: "Missing payment verification fields" });
    }

    const isValid = verifyRazorpaySignature(
      razorpay_signature,
      razorpay_order_id,
      razorpay_payment_id,
    );
    if (!isValid) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Bind the Razorpay order to our internal order to prevent a valid
    // signature from one (cheap) order being replayed against another
    // (expensive) order. `receipt` was set to our orderId at creation time.
    const razorpayOrder = await getRazorpay().orders.fetch(razorpay_order_id);
    if (String(razorpayOrder.receipt) !== String(orderId)) {
      return res
        .status(400)
        .json({ message: "Payment does not match this order" });
    }
    if (razorpayOrder.status !== "paid") {
      return res.status(400).json({ message: "Payment not captured" });
    }

    await publishPaymentSuccess({
      orderId,
      paymentId: razorpay_payment_id,
      provider: "razorpay",
    });
    return res.status(200).json({ message: "Payment verified successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to verify Razorpay payment" });
  }
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const payWithStripe = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }
    const { data } = await axios.get(
      `${process.env.RESTAURANT_SERVICE_URL}/api/order/payment/${orderId}`,
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );
    if (!data.success) {
      return res.status(400).json({ message: "Failed to fetch order" });
    }
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Payment for your order",
            },
            unit_amount: data.amount * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: orderId,
      },
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout`,
    });
    return res.json({ url: stripeSession.url });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to pay with Stripe",
      error: getErrorMessage(err),
    });
  }
};

export const verifyStripePayment = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ message: "Session ID is required" });
    }
    const session = await stripe.checkout.sessions.retrieve(
      session_id as string,
    );
    if (!session) {
      res.status(400).json({ message: "Payment failed" });
      return;
    }
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      res.status(400).json({ message: "Order ID not found" });
      return;
    }
    await publishPaymentSuccess({
      orderId,
      paymentId: session.payment_intent as string,
      provider: "stripe",
    });
    return res.status(200).json({ message: "Payment verified successfully" });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to verify Stripe payment",
      error: getErrorMessage(err),
    });
  }
};
