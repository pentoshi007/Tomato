import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { utilsService } from "../config";
import { useAppContext } from "../context/AppContext";
import { Spinner } from "../components/ui/primitives";
import { Burger } from "../components/ui/illustrations";

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
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="card animate-pop-in w-full max-w-md space-y-4 p-8 text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-butter shadow-pop-sm">
              <Spinner size={34} />
            </div>
            <p className="text-sm font-bold text-smoke">
              Verifying your payment…
            </p>
          </>
        )}

        {status === "success" && (
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
                onClick={() => navigate("/orders")}
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

        {status === "failed" && (
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
                Payment failed
              </h1>
              <p className="mt-1.5 text-sm font-medium text-smoke">
                {errorMsg ||
                  "We could not verify your payment. Please try again."}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => navigate("/checkout")}
                className="btn-primary w-full !py-3"
              >
                Try again
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
