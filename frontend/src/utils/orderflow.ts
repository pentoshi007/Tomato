import type { IOrderItem, OrderStatus } from "../types";

export const NEW_ORDER_EVENT = "order:new";
export const ORDER_UPDATE_EVENT = "order:update";
export const CUSTOMER_ORDER_EVENTS = [NEW_ORDER_EVENT, ORDER_UPDATE_EVENT];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready_for_rider: "Ready for pickup",
  rider_assigned: "Rider assigned",
  picked_up: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Which actions the restaurant can take at each status
export const ORDER_ACTIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  placed: ["accepted"],
  accepted: ["preparing"],
  preparing: ["ready_for_rider"],
};

// Human-readable label for each action button
export const ACTION_LABELS: Record<string, string> = {
  accepted: "Accept Order",
  preparing: "Start Preparing",
  ready_for_rider: "Ready for Pickup",
};

export const ACTIVE_STATUSES: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

export const ORDER_PROGRESS_STEPS: OrderStatus[] = [
  ...ACTIVE_STATUSES,
  "delivered",
];

export const isActiveOrder = (order: { status: OrderStatus }) =>
  ACTIVE_STATUSES.includes(order.status);

export const getOrderStatusLabel = (status: OrderStatus) =>
  ORDER_STATUS_LABELS[status];

export const formatOrderDateTime = (date: Date | string) =>
  new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatOrderPrice = (amount: number) =>
  `₹${amount.toLocaleString("en-IN")}`;

export const summarizeOrderItems = (items: IOrderItem[]) =>
  items.map((item) => `${item.name} ×${item.quantity}`).join(", ");

// Status badge colour — changes across the order lifecycle
export const getOrderStatusClass = (status: OrderStatus | string) => {
  switch (status) {
    case "placed":
      return "bg-amber-100 text-amber-700";
    case "accepted":
      return "bg-emerald-100 text-emerald-700";
    case "preparing":
      return "bg-blue-100 text-blue-700";
    case "ready_for_rider":
      return "bg-indigo-100 text-indigo-700";
    case "rider_assigned":
      return "bg-violet-100 text-violet-700";
    case "picked_up":
      return "bg-purple-100 text-purple-700";
    case "delivered":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

// Action button colour matches the target status colour
export const getActionButtonClass = (targetStatus: string) => {
  switch (targetStatus) {
    case "accepted":
      return "bg-emerald-500 hover:bg-emerald-600 text-white";
    case "preparing":
      return "bg-blue-500 hover:bg-blue-600 text-white";
    case "ready_for_rider":
      return "bg-indigo-500 hover:bg-indigo-600 text-white";
    default:
      return "bg-slate-500 hover:bg-slate-600 text-white";
  }
};
