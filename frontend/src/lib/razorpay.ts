type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

const CHECKOUT_URL = import.meta.env.VITE_RAZORPAY_CHECKOUT_URL as
  | string
  | undefined;

let pending: Promise<RazorpayConstructor> | null = null;

function readConstructor(): RazorpayConstructor | null {
  return (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay
    ?? null;
}

/**
 * Loads the Razorpay checkout script on first use. It used to be an eager
 * <script> in index.html on every page; only the checkout flow needs it.
 */
export function loadRazorpay(): Promise<RazorpayConstructor> {
  const existing = readConstructor();
  if (existing) return Promise.resolve(existing);
  if (pending) return pending;
  if (!CHECKOUT_URL) {
    return Promise.reject(
      new Error("Razorpay checkout URL is not configured"),
    );
  }
  pending = new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_URL;
    script.async = true;
    script.onload = () => {
      const ctor = readConstructor();
      if (ctor) {
        resolve(ctor);
      } else {
        pending = null;
        reject(new Error("Razorpay checkout loaded but did not initialize"));
      }
    };
    script.onerror = () => {
      pending = null;
      reject(new Error("Could not load Razorpay checkout"));
    };
    document.head.appendChild(script);
  });
  return pending;
}
