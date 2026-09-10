const KEY = "tomato.payment.confirming";
const CONFIRM_WINDOW_MS = 60_000;

export const markPaymentConfirming = () => {
  sessionStorage.setItem(KEY, String(Date.now()));
};

export const paymentConfirmingStartedAt = () => {
  const startedAt = Number(sessionStorage.getItem(KEY));
  if (!Number.isFinite(startedAt) || startedAt <= 0) return null;
  return Date.now() - startedAt <= CONFIRM_WINDOW_MS ? startedAt : null;
};

export const clearPaymentConfirming = () => {
  sessionStorage.removeItem(KEY);
};
