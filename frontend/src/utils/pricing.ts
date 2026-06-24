// Single source of truth for order pricing on the frontend.
// These must stay in sync with the backend (services/restaurant order controller).
export const FREE_DELIVERY_THRESHOLD = 250;
export const DELIVERY_FEE = 49;
export const PLATFORM_FEE = 5;

export const getDeliveryFee = (subTotal: number): number =>
  subTotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;

export const getGrandTotal = (subTotal: number): number =>
  subTotal + getDeliveryFee(subTotal) + PLATFORM_FEE;

export const getAmountForFreeDelivery = (subTotal: number): number =>
  FREE_DELIVERY_THRESHOLD - subTotal;
