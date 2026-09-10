import type { ReactNode } from "react";
import { Logo } from "./Logo";

export const Spinner = ({
  size = 20,
  className = "text-tomato",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    className={`animate-spin ${className}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-label="Loading"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeOpacity="0.2"
      strokeWidth="3.5"
    />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
  </svg>
);

export const PageLoader = ({ label = "Plating up…" }: { label?: string }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream">
    <div className="animate-floaty">
      <Logo size={56} withWordmark={false} />
    </div>
    <p className="font-display text-sm font-bold tracking-widest text-smoke uppercase">
      {label}
    </p>
  </div>
);

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`skeleton ${className}`} />
);

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  body,
  action,
  className = "",
}: EmptyStateProps) => (
  <div
    className={`card-flat flex flex-col items-center gap-3 border-dashed px-6 py-14 text-center ${className}`}
  >
    {icon && (
      <div className="mb-1 flex items-center justify-center">{icon}</div>
    )}
    <h3 className="font-display text-xl font-bold">{title}</h3>
    {body && <p className="max-w-sm text-sm text-smoke">{body}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

type BadgeTone =
  | "tomato"
  | "basil"
  | "mustard"
  | "sky"
  | "ink"
  | "plain"
  | "blush";

const badgeTones: Record<BadgeTone, string> = {
  tomato: "bg-tomato text-white",
  basil: "bg-basil text-white",
  mustard: "bg-mustard text-ink",
  sky: "bg-sky text-white",
  ink: "bg-ink text-cream",
  plain: "bg-paper text-ink",
  blush: "bg-blush text-ink",
};

export const Badge = ({
  tone = "plain",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) => (
  <span className={`chip ${badgeTones[tone]} ${className}`}>{children}</span>
);
