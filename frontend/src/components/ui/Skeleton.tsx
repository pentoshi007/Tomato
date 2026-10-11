import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

/** Opaque pulse blocks — deliberately no shimmer gradient. */
export function Skeleton({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-tomato-wash", className)}
      {...rest}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-sticker border-2 border-line bg-white p-4">
      <Skeleton className="mb-3 aspect-[16/10] w-full" />
      <Skeleton className="mb-2 h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Skeleton className="size-12 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}
