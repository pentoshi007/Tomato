import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { getOrderStatusLabel } from "../../utils/orderflow";
import type { OrderStatus } from "../../types";

export type BadgeTone =
  | "tomato"
  | "butter"
  | "basil"
  | "blue"
  | "ink"
  | "paper";

type BadgeProps = {
  tone?: BadgeTone;
  /** Slight sticker tilt for playful emphasis. */
  rotate?: boolean;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
};

const tones: Record<BadgeTone, string> = {
  tomato: "bg-tomato-deep text-white",
  butter: "bg-butter text-ink",
  basil: "bg-basil text-white",
  blue: "bg-blue text-white",
  ink: "bg-ink text-paper",
  paper: "bg-white text-ink",
};

export function Badge({
  tone = "paper",
  rotate = false,
  size = "md",
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 border-ink font-bold",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        "shadow-pop-sm",
        tones[tone],
        rotate && "-rotate-2",
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusTone: Record<OrderStatus, BadgeTone> = {
  placed: "butter",
  accepted: "basil",
  preparing: "blue",
  ready_for_rider: "blue",
  rider_assigned: "ink",
  picked_up: "ink",
  delivered: "basil",
  cancelled: "tomato",
};

export function StatusPill({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <Badge tone={statusTone[status]} className={className}>
      {getOrderStatusLabel(status)}
    </Badge>
  );
}
