import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { TomatoMascot, type MascotMood } from "../brand/Mascot";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  mood?: MascotMood;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  mood = "sad",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <TomatoMascot mood={mood} size={104} />
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      {description && (
        <p className="max-w-xs text-sm text-ink/60">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
