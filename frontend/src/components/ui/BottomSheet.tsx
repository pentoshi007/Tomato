import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Sticky action bar pinned above the safe area, e.g. "Add to cart". */
  footer?: ReactNode;
  className?: string;
};

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative max-h-[85dvh] w-full animate-slide-up overflow-y-auto rounded-t-sticker border-x-2 border-t-2 border-ink bg-paper pb-[max(1rem,env(safe-area-inset-bottom))] shadow-pop-lg outline-none",
          className,
        )}
      >
        <div className="sticky top-0 z-10 bg-paper pt-3">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-line-strong" />
          {title && (
            <h2 className="mt-3 px-5 font-display text-lg font-bold text-ink">
              {title}
            </h2>
          )}
        </div>
        <div className="px-5 pb-2 pt-3">{children}</div>
        {footer && (
          <div className="sticky bottom-0 border-t-2 border-line bg-paper px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
