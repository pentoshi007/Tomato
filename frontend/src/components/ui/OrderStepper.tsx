import { cn } from "../../lib/cn";
import {
  ORDER_PROGRESS_STEPS,
  ORDER_STATUS_LABELS,
} from "../../utils/orderflow";
import type { OrderStatus } from "../../types";

type OrderStepperProps = {
  status: OrderStatus;
  /** "compact": dot track for list cards. "detailed": every step labelled. */
  variant?: "compact" | "detailed";
  className?: string;
};

export function OrderStepper({
  status,
  variant = "compact",
  className,
}: OrderStepperProps) {
  if (status === "cancelled") return null;
  const currentIdx = ORDER_PROGRESS_STEPS.indexOf(status);
  if (currentIdx < 0) return null;

  if (variant === "detailed") {
    return (
      <ol className={cn("flex items-start", className)}>
        {ORDER_PROGRESS_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const current = i === currentIdx;
          return (
            <li
              key={step}
              className={cn(
                "flex min-w-[72px] flex-1 flex-col items-center gap-1.5",
              )}
            >
              <div className="flex w-full items-center">
                <div
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full border-2 transition-colors duration-300",
                    done
                      ? "border-ink bg-tomato-deep"
                      : "border-line-strong bg-white",
                    current && "ring-4 ring-butter",
                  )}
                />
                {i < ORDER_PROGRESS_STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    className={cn(
                      "h-1 flex-1 transition-colors duration-300",
                      i < currentIdx ? "bg-tomato-deep" : "bg-line",
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-center text-[10px] leading-tight",
                  current
                    ? "font-bold text-ink"
                    : done
                      ? "font-semibold text-ink/70"
                      : "text-ink/40",
                )}
              >
                {ORDER_STATUS_LABELS[step]}
              </span>
              <span className="sr-only">
                {current ? "(current)" : done ? "(done)" : ""}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center">
        {ORDER_PROGRESS_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const current = i === currentIdx;
          return (
            <div key={step} className="flex flex-1 items-center">
              <div
                aria-hidden="true"
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full transition-all duration-300",
                  done
                    ? "border-2 border-ink bg-tomato-deep"
                    : "border-2 border-line-strong bg-white",
                  current && "ring-4 ring-tomato-wash",
                )}
              />
              {i < ORDER_PROGRESS_STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "h-0.5 flex-1 transition-colors duration-300",
                    i < currentIdx ? "bg-tomato-deep" : "bg-line",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-ink/50">
        <span>Placed</span>
        <span>On the way</span>
        <span>Delivered</span>
      </div>
    </div>
  );
}
