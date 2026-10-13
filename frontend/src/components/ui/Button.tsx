import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "butter" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-xl border-2 font-semibold transition-[transform,box-shadow,background-color,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "border-ink bg-tomato-deep text-white shadow-pop hover:bg-tomato active:translate-x-1 active:translate-y-1 active:shadow-none",
  secondary:
    "border-ink bg-white text-ink shadow-pop-sm hover:bg-paper active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
  butter:
    "border-ink bg-butter text-ink shadow-pop-sm hover:shadow-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
  ghost:
    "border-transparent bg-transparent text-ink hover:border-ink hover:bg-white",
  danger:
    "border-ink bg-tomato-dark text-white shadow-pop hover:opacity-90 active:translate-x-1 active:translate-y-1 active:shadow-none",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

export function ButtonSpinner() {
  return (
    <span className="inline-flex flex-col items-center gap-2">
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-4 border-tomato-wash border-t-tomato-deep"
      />
      <span className="text-sm text-ink/60">Loading…</span>
    </span>
  );
}

export type { ReactNode };
