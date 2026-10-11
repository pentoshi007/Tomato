import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  icon?: ReactNode;
};

export function Chip({
  selected = false,
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold transition-[transform,box-shadow,background-color,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2",
        selected
          ? "border-ink bg-tomato-deep text-white shadow-pop-sm"
          : "border-line-strong bg-white text-ink hover:border-ink",
        "active:translate-y-px",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
