import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { restaurantService, utilsService } from "../config";
import { getApiErrorMessage } from "../lib/api";
import { loadRazorpay } from "../lib/razorpay";
import { Spinner } from "../components/ui/primitives";
import { Burger } from "../components/ui/illustrations";
import { clearPaymentConfirming } from "../utils/paymentConfirmation";
import type { IOrder, PaymentMethod, PaymentStatus } from "../types";

type Phase = "loading" | "paid" | "pending" | "failed";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type SuccessNavState = {
  orderId?: string;
  razorpay?: RazorpayResponse;
  cancelled?: boolean;
};

type PollResult = { status: PaymentStatus | "timeout"; method: PaymentMethod };

const TOMATO_COLOR = "#E23744";
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 15;
const CANCELLED_MESSAGE =
  "Payment was cancelled. Your order is still waiting for payment.";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const fetchOrder = async (orderId: string): Promise<IOrder> => {
  const { data } = await axios.get<{ order: IOrder }>(
    `${restaurantService}/api/order/${orderId}`,
    { headers: authHeaders() },
  );
  return data.order;
};

const pollPayment = async (
  orderId: string,
  isActive: () => boolean,
): Promise<PollResult> => {
  let method: PaymentMethod = "razorpay";
  for (let attempt = 0; attempt < MAX_POLLS && isActive(); attempt++) {
    if (attempt > 0) await delay(POLL_INTERVAL_MS);
    try {
      const order = await fetchOrder(orderId);
      method = order.paymentMethod;
      if (order.paymentStatus !== "pending") {
        return { status: order.paymentStatus, method };
      }
    } catch {
      continue;
    }
  }
  return { status: "timeout", method };
};

const verifyRazorpay = async (orderId: string, response: RazorpayResponse) => {
  await axios.post(
    `${utilsService}/api/payment/verify`,
    { ...response, orderId },
    { headers: authHeaders() },
  );
};

const verifyStripe = async (sessionId: string): Promise<string> => {
  const { data } = await axios.get<{ orderId: string }>(
    `${utilsService}/api/payment/stripe/verify`,
    { params: { session_id: sessionId }, headers: authHeaders() },
  );
  return data.orderId;
};

const createStripeCheckout = async (orderId: string) => {
  const { data } = await axios.post<{
    url?: string;
    error?: string;
    message?: string;
  }>(
    `${utilsService}/api/payment/stripe/create`,
    { orderId },
    { headers: authHeaders() },
  );
  if (!data.url) {
    throw new Error(data.error || data.message || "Failed to create payment");
  }
  window.location.href = data.url;
};

const openRazorpayCheckout = async (
  orderId: string,
  onPaid: (response: RazorpayResponse) => void,
  onDismiss: () => void,
) => {
  const { data } = await axios.post<{
    success: boolean;
    razorpayOrderId: string;
    key: string;
    amount: number;
    error?: string;
    message?: string;
  }>(`${utilsService}/api/payment/create`, { orderId }, { headers: authHeaders() });
  if (!data.success) {
    throw new Error(data.error || data.message || "Failed to create payment");
  }
  const Razorpay = await loadRazorpay();
  let completed = false;
  new Razorpay({
    key: data.key,
    amount: data.amount,
    currency: "INR",
    order_id: data.razorpayOrderId,
    name: "Tomato",
    description: "Payment for your order",
    handler: (response: RazorpayResponse) => {
      completed = true;
      onPaid(response);
    },
    modal: {
      ondismiss: () => {
        if (!completed) onDismiss();
      },
    },
    theme: { color: TOMATO_COLOR },
  }).open();
};

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = useState<Phase>("loading");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);
  const [razorpayResponse, setRazorpayResponse] =
    useState<RazorpayResponse | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("razorpay");
  const [message, setMessage] = useState("");
  const mountedRef = useRef(false);
  const startedRef = useRef(false);

  const isMounted = () => mountedRef.current;

  const fail = (text: string) => {
    setMessage(text);
    setPhase("failed");
  };

  const confirm = async (id: string, verify?: () => Promise<void>) => {
    setOrderId(id);
    setPhase("loading");
    if (verify) {
      try {
        await verify();
      } catch (error) {
        if (isMounted()) fail(getApiErrorMessage(error));
        return;
      }
    }
    const result = await pollPayment(id, isMounted);
    if (!isMounted()) return;
    setMethod(result.method);
    if (result.status === "paid") {
      clearPaymentConfirming();
      setPhase("paid");
    } else if (result.status === "failed") {
      fail("Your payment could not be completed.");
    } else {
      setPhase("pending");
    }
  };

  const startStripe = async (sessionId: string) => {
    setStripeSessionId(sessionId);
    setPhase("loading");
    try {
      const id = await verifyStripe(sessionId);
      await confirm(id);
    } catch (error) {
      if (isMounted()) fail(getApiErrorMessage(error));
    }
  };

  const startPayment = async (id: string, paymentMethod: PaymentMethod) => {
    setOrderId(id);
    setRazorpayResponse(null);
    setPhase("loading");
    try {
      if (paymentMethod === "stripe") {
        await createStripeCheckout(id);
        return;
      }
      await openRazorpayCheckout(
        id,
        (response) => {
          setRazorpayResponse(response);
          void confirm(id, () => verifyRazorpay(id, response));
        },
        () => {
          if (isMounted()) fail(CANCELLED_MESSAGE);
        },
      );
      if (isMounted()) setPhase("pending");
    } catch (error) {
      if (isMounted()) fail(getApiErrorMessage(error));
    }
  };

  const recheck = () => {
    if (!orderId) return;
    if (razorpayResponse) {
      const response = razorpayResponse;
      void confirm(orderId, () => verifyRazorpay(orderId, response));
      return;
    }
    void confirm(orderId);
  };

  const retry = () => {
    if (!orderId) {
      if (stripeSessionId) void startStripe(stripeSessionId);
      return;
    }
    if (razorpayResponse) {
      recheck();
      return;
    }
    void startPayment(orderId, method);
  };

  const payNow = () => {
    if (orderId) void startPayment(orderId, method);
  };

  const start = (): void => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      void startStripe(sessionId);
      return;
    }
    const state = (location.state ?? {}) as SuccessNavState;
    if (state.cancelled && state.orderId) {
      setOrderId(state.orderId);
      fail(CANCELLED_MESSAGE);
      return;
    }
    const { orderId: stateOrderId, razorpay } = state;
    if (razorpay && stateOrderId) {
      setRazorpayResponse(razorpay);
      void confirm(stateOrderId, () => verifyRazorpay(stateOrderId, razorpay));
      return;
    }
    const queryOrderId = searchParams.get("orderId") ?? stateOrderId;
    if (queryOrderId) {
      void confirm(queryOrderId);
      return;
    }
    fail("No payment was found for this order.");
  };

  useEffect(() => {
    mountedRef.current = true;
    if (!startedRef.current) {
      startedRef.current = true;
      start();
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div
        role="status"
        aria-live="polite"
        className="card animate-pop-in w-full max-w-md space-y-4 p-8 text-center"
      >
        {phase === "loading" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-butter shadow-pop-sm">
              <Spinner size={34} />
            </div>
            <p className="text-sm font-bold text-smoke">
              Confirming your payment...
            </p>
          </>
        )}

        {phase === "paid" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-mint shadow-pop-sm">
              <svg
                width="38"
                height="38"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1E9E62"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">
                Order placed!
              </h1>
              <p className="mt-1.5 text-sm font-medium text-smoke">
                Payment confirmed — the kitchen is on it.
              </p>
            </div>
            <div className="flex justify-center">
              <Burger size={72} className="animate-floaty" />
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() =>
                  navigate(orderId ? `/order/${orderId}` : "/orders")
                }
                className="btn-primary w-full !py-3"
              >
                Track my order
              </button>
              <button
                onClick={() => navigate("/")}
                className="btn-secondary w-full !py-3"
              >
                Order more
              </button>
            </div>
          </>
        )}

        {phase === "pending" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-butter shadow-pop-sm">
              <Spinner size={34} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">
                Payment pending
              </h1>
              <p className="mt-1.5 text-sm font-medium text-smoke">
                We have not received confirmation yet. Check again in a moment,
                or pay again if the order is still unpaid.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button onClick={recheck} className="btn-primary w-full !py-3">
                Check again
              </button>
              <button onClick={payNow} className="btn-secondary w-full !py-3">
                Pay now
              </button>
              <button
                onClick={() => navigate("/orders")}
                className="btn-secondary w-full !py-3"
              >
                My orders
              </button>
            </div>
          </>
        )}

        {phase === "failed" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-blush shadow-pop-sm">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E23744"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">
                Payment not completed
              </h1>
              <p className="mt-1.5 text-sm font-medium text-smoke">
                {message || "We could not verify your payment. Please try again."}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button onClick={retry} className="btn-primary w-full !py-3">
                {razorpayResponse ? "Verify again" : "Try again"}
              </button>
              <button
                onClick={() => navigate("/orders")}
                className="btn-secondary w-full !py-3"
              >
                My orders
              </button>
              <button
                onClick={() => navigate("/")}
                className="btn-secondary w-full !py-3"
              >
                Go home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
