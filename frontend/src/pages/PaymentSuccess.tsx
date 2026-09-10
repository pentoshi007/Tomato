import { useNavigate, useParams } from "react-router-dom";
import { Burger } from "../components/ui/illustrations";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { paymentId } = useParams();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="card animate-pop-in w-full max-w-md space-y-4 p-8 text-center">
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
            Payment successful
          </h1>
          <p className="mt-1.5 text-sm font-medium text-smoke">
            Your order is in — the kitchen is firing it up.
          </p>
        </div>

        <div className="flex justify-center">
          <Burger size={72} className="animate-floaty" />
        </div>

        {paymentId && (
          <p className="rounded-lg border-2 border-dashed border-mist px-3 py-2 font-mono text-[10px] break-all text-smoke">
            Payment ID: {paymentId}
          </p>
        )}

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
      </div>
    </div>
  );
}
