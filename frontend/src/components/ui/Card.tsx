import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "sticker" | "flat" | "interactive";
};

const variants = {
  sticker: "rounded-sticker border-2 border-ink bg-white shadow-pop",
  flat: "rounded-sticker border-2 border-line bg-white",
  interactive:
    "cursor-pointer rounded-sticker border-2 border-line bg-white transition-[border-color,box-shadow] hover:border-ink hover:shadow-pop-sm",
} as const;

export function Card({
  variant = "flat",
  className,
  ...rest
}: CardProps) {
  return <div className={cn(variants[variant], className)} {...rest} />;
}
