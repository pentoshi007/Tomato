import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { utilsService } from "../App";
import { useAppContext } from "../context/AppContext";

const TOMATO_COLOR = "#E23744";

type Status = "loading" | "success" | "failed";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchMyCart } = useAppContext();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setStatus("failed");
      setErrorMsg("No payment session found.");
      return;
    }

    (async () => {
      try {
        await axios.get(
          `${utilsService}/api/payment/stripe/verify?session_id=${sessionId}`,
        );
        await fetchMyCart();
        setStatus("success");
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setErrorMsg(
            err.response?.data?.message || "Payment verification failed.",
          );
        } else {
          setErrorMsg("Payment verification failed.");
        }
        setStatus("failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm p-8 text-center space-y-4">
        {status === "loading" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <svg
                className="animate-spin"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke={TOMATO_COLOR}
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Verifying your payment…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Order Placed!
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Your payment was successful and your order is being prepared.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => navigate("/")}
                className="w-full rounded-lg px-4 py-2.5 font-semibold text-white transition"
                style={{ backgroundColor: TOMATO_COLOR }}
              >
                Order More
              </button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke={TOMATO_COLOR}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Payment Failed
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {errorMsg || "We could not verify your payment. Please try again."}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => navigate("/checkout")}
                className="w-full rounded-lg px-4 py-2.5 font-semibold text-white transition"
                style={{ backgroundColor: TOMATO_COLOR }}
              >
                Try Again
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full rounded-lg px-4 py-2.5 font-semibold transition border border-gray-200 text-gray-600"
              >
                Go Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
