import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required — icon-only buttons must be announced to screen readers. */
  "aria-label": string;
  size?: "sm" | "md";
  tone?: "plain" | "sticker" | "danger";
};

const tones = {
  plain:
    "border-transparent bg-transparent text-ink hover:bg-tomato-wash active:translate-y-px",
  sticker:
    "border-ink bg-white text-ink shadow-pop-sm hover:bg-paper active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
  danger:
    "border-ink bg-tomato-deep text-white shadow-pop-sm hover:bg-tomato active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
} as const;

export function IconButton({
  size = "md",
  tone = "plain",
  className,
  children,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl border-2 transition-[transform,box-shadow,background-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "size-9" : "size-11",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export type { ReactNode };
