import { useEffect, useRef, useState } from "react";
import {
  BiBuilding,
  BiCheck,
  BiCreditCard,
  BiMobile,
  BiWallet,
  BiX,
} from "react-icons/bi";
import { Spinner } from "../components/ui/primitives";

export type DemoGateway = "razorpay" | "stripe";

interface DemoPaymentSheetProps {
  gateway: DemoGateway;
  amount: number;
  restaurantName: string;
  onPay: () => Promise<boolean>;
  onDone: (paid: boolean) => void;
}

type Phase = "select" | "processing" | "success" | "failed";

const RAZORPAY_METHODS = [
  { id: "upi", label: "UPI", hint: "GPay · PhonePe · Paytm", Icon: BiMobile },
  { id: "card", label: "Card", hint: "Visa · Mastercard · RuPay", Icon: BiCreditCard },
  { id: "netbanking", label: "Netbanking", hint: "All major banks", Icon: BiBuilding },
  { id: "wallet", label: "Wallet", hint: "Paytm · Amazon Pay", Icon: BiWallet },
];

const RazorpayMark = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="#fff" />
    <path d="M9.2 6.5h4.1c2 0 3.2 1 3.2 2.6 0 1.1-.6 1.9-1.6 2.3l2 3.6h-2.4l-1.7-3.2h-1.4v3.2H9.2V6.5Zm2.2 1.9v2.1h1.7c.8 0 1.3-.4 1.3-1s-.5-1.1-1.3-1.1h-1.7Z" fill="#2D81F7" />
  </svg>
);

const StripeMark = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="#fff" />
    <path d="M11.1 9.7c0-.5.5-.8 1.2-.8 1 0 2.2.3 3.2.8l.7-2.3a8.6 8.6 0 0 0-3.9-.9c-2.4 0-4 1.3-4 3.3 0 3.2 4.4 2.5 4.4 4 0 .6-.5.9-1.4.9-1.1 0-2.5-.4-3.6-1l-.7 2.4c1.1.6 2.6 1 4.2 1 2.6 0 4.2-1.3 4.2-3.4 0-3.3-4.3-2.6-4.3-4Z" fill="#635BFF" />
  </svg>
);

const DemoPaymentSheet = ({
  gateway,
  amount,
  restaurantName,
  onPay,
  onDone,
}: DemoPaymentSheetProps) => {
  const isRazorpay = gateway === "razorpay";
  const [phase, setPhase] = useState<Phase>("select");
  const [method, setMethod] = useState("upi");
  const timerRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLInputElement | null>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (cardRef.current) cardRef.current.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && phase !== "processing")
        onDoneRef.current(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [phase]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const pay = async () => {
    setPhase("processing");
    const paid = await onPay();
    if (paid) {
      setPhase("success");
      timerRef.current = window.setTimeout(
        () => onDoneRef.current(true),
        1400,
      );
    } else {
      setPhase("failed");
    }
  };

  const brand = isRazorpay ? "#2D81F7" : "#635BFF";
  const brandLabel = isRazorpay ? "Razorpay" : "Stripe";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-ink/55 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={() => phase !== "processing" && onDone(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-payment-title"
        onClick={(event) => event.stopPropagation()}
        className="card animate-pop-in max-h-[92dvh] w-full max-w-md overflow-y-auto !rounded-b-none sm:!rounded-2xl"
      >
        <div
          className="flex items-center justify-between gap-3 border-b-2 border-ink p-5"
          style={{ background: brand }}
        >
          <div className="flex items-center gap-2.5 text-white">
            {isRazorpay ? <RazorpayMark /> : <StripeMark />}
            <span className="font-display text-lg font-extrabold tracking-tight">
              {brandLabel}
            </span>
            <span className="rounded-full border border-white/50 px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
              Demo
            </span>
          </div>
          {phase !== "processing" && (
            <button
              type="button"
              onClick={() => onDone(false)}
              aria-label="Close payment sheet"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-paper shadow-pop-xs transition-transform hover:-translate-0.5"
            >
              <BiX className="h-4 w-4" />
            </button>
          )}
        </div>

        {phase === "select" && (
          <div className="space-y-4 p-5">
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] text-smoke uppercase">
                Paying
              </p>
              <h2
                id="demo-payment-title"
                className="font-display mt-0.5 text-xl font-extrabold tracking-tight"
              >
                ₹{amount.toFixed(2)}{" "}
                <span className="text-sm font-bold text-smoke">
                  to {restaurantName}
                </span>
              </h2>
            </div>

            {isRazorpay ? (
              <div className="grid grid-cols-2 gap-2.5">
                {RAZORPAY_METHODS.map(({ id, label, hint, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMethod(id)}
                    aria-pressed={method === id}
                    className={`cursor-pointer rounded-2xl border-2 border-ink p-3 text-left transition-all ${
                      method === id
                        ? "-translate-0.5 bg-butter shadow-pop-sm"
                        : "bg-paper shadow-pop-xs hover:-translate-0.5"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-tomato" />
                    <p className="mt-1.5 text-sm font-bold">{label}</p>
                    <p className="text-[10px] font-semibold text-smoke">
                      {hint}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                <label className="block">
                  <span className="text-xs font-bold text-smoke">
                    Card number
                  </span>
                  <input
                    ref={cardRef}
                    defaultValue="4242 4242 4242 4242"
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl border-2 border-ink bg-white px-3.5 py-2.5 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-tomato"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="block">
                    <span className="text-xs font-bold text-smoke">Expiry</span>
                    <input
                      defaultValue="12 / 34"
                      className="mt-1 w-full rounded-xl border-2 border-ink bg-white px-3.5 py-2.5 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-tomato"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-smoke">CVC</span>
                    <input
                      defaultValue="424"
                      inputMode="numeric"
                      className="mt-1 w-full rounded-xl border-2 border-ink bg-white px-3.5 py-2.5 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-tomato"
                    />
                  </label>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => void pay()}
              className="btn-primary w-full !py-3 !text-base"
            >
              Pay ₹{amount.toFixed(2)}
            </button>
            <p className="text-center text-[10px] font-bold text-smoke">
              Simulated {brandLabel} checkout — no real money moves
            </p>
          </div>
        )}

        {phase === "processing" && (
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <Spinner size={34} className="text-tomato" />
            <div>
              <p className="font-display text-lg font-extrabold">
                Contacting {brandLabel}…
              </p>
              <p className="mt-1 text-xs font-semibold text-smoke">
                Authorising ₹{amount.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {phase === "success" && (
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <span className="flex h-16 w-16 animate-pop-in items-center justify-center rounded-full border-2 border-ink bg-basil text-white shadow-pop-sm">
              <BiCheck className="h-8 w-8" />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold">
                Payment successful
              </p>
              <p className="mt-1 text-xs font-semibold text-smoke">
                ₹{amount.toFixed(2)} paid via {brandLabel}
              </p>
            </div>
          </div>
        )}

        {phase === "failed" && (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-blush">
              <BiX className="h-7 w-7 text-tomato" />
            </span>
            <p className="font-display text-lg font-extrabold">
              Payment could not be completed
            </p>
            <div className="flex w-full gap-2.5">
              <button
                type="button"
                onClick={() => onDone(false)}
                className="btn-secondary flex-1 !py-2.5 !text-xs"
              >
                Back to checkout
              </button>
              <button
                type="button"
                onClick={() => setPhase("select")}
                className="btn-primary flex-1 !py-2.5 !text-xs"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoPaymentSheet;
