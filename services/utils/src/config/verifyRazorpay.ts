import crypto from "crypto";

export const verifyRazorpaySignature = (
  signature: string,
  orderId: string,
  paymentId: string,
) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
};
