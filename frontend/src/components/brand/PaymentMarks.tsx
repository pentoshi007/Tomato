/**
 * Payment provider marks. The colors below are the providers' official brand
 * colors (Razorpay blue, Stripe blurple) — intentionally not Tomato tokens.
 */
const RAZORPAY_BLUE = "#2D81F7";
const STRIPE_PURPLE = "#635BFF";

type MarkProps = {
  size?: number;
  className?: string;
};

export function RazorpayMark({ size = 22, className = "" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="24" height="24" rx="6" fill={RAZORPAY_BLUE} />
      <path
        d="M7 17L10.5 7H13L15 13.5L17 7H19.5L16.5 17H14L12 10.5L10 17H7Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function StripeMark({ size = 22, className = "" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="24" height="24" rx="6" fill={STRIPE_PURPLE} />
      <path
        d="M11.5 9.5c0-.55.45-.9 1.1-.9.95 0 1.9.45 2.6 1.1l1.3-1.9c-1-.8-2.4-1.3-3.9-1.3-2.25 0-3.8 1.25-3.8 3.15 0 3.5 4.9 2.85 4.9 4.5 0 .65-.55 1.05-1.35 1.05-1.15 0-2.25-.55-3.05-1.4L8 15.7c1 .95 2.6 1.75 4.35 1.75 2.35 0 4-1.25 4-3.4 0-3.65-4.85-2.9-4.85-4.55Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
