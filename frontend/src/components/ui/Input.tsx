import { useId, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({
  label,
  error,
  hint,
  className,
  id,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ?? hint;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-semibold text-ink"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy ? `${inputId}-desc` : undefined}
        className={cn(
          "h-11 w-full rounded-xl border-2 bg-white px-3.5 text-ink placeholder:text-ink/40 focus:outline-none",
          error ? "border-tomato" : "border-line-strong focus:border-ink",
          className,
        )}
        {...rest}
      />
      {describedBy && (
        <p
          id={`${inputId}-desc`}
          className={cn(
            "mt-1.5 text-xs",
            error ? "font-semibold text-tomato-deep" : "text-ink/50",
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
