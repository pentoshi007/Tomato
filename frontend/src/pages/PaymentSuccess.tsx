import { useNavigate, useParams } from "react-router-dom";

const TOMATO_COLOR = "#E23744";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { paymentId } = useParams();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm p-8 text-center space-y-4">
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
            Payment Successful
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Your order has been placed and is being prepared.
          </p>
        </div>

        {paymentId && (
          <p className="text-xs text-gray-400 break-all">
            Payment ID: {paymentId}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => navigate("/")}
            className="w-full rounded-lg px-4 py-2.5 font-semibold text-white transition"
            style={{ backgroundColor: TOMATO_COLOR }}
          >
            Order More
          </button>
        </div>
      </div>
    </div>
  );
}
