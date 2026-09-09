import { BiMapPin, BiPackage, BiTimeFive } from "react-icons/bi";
import { useEffect, useState } from "react";
import type { IOrder, OrderStatus } from "../types";
import {
  getOrderStatusClass,
  getActionButtonClass,
  getOrderStatusLabel,
  formatOrderPrice,
  ORDER_ACTIONS,
  ACTION_LABELS,
} from "../utils/orderflow";
import { restaurantService } from "../config";
import axios from "axios";
import toast from "react-hot-toast";

type OrderCardProps = {
  order: IOrder;
  onStatusUpdated: () => void;
};

const OrderCard = ({ order, onStatusUpdated }: OrderCardProps) => {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [loading, setLoading] = useState(false);
  const [retryVisible, setRetryVisible] = useState(false);

  const actions = ORDER_ACTIONS[currentStatus] ?? [];

  useEffect(() => {
    if (order.status !== "ready_for_rider") {
      setRetryVisible(false);
      return;
    }
    const timer = setTimeout(() => {
      setRetryVisible(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [order.status]);

  useEffect(() => {
    setCurrentStatus(order.status);
  }, [order.status]);

  const updateStatus = async (newStatus: OrderStatus) => {
    try {
      setLoading(true);
      setRetryVisible(false);
      await axios.put(
        `${restaurantService}/api/order/${order._id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setCurrentStatus(newStatus);
      toast.success(`Marked as ${ACTION_LABELS[newStatus] ?? newStatus}`);
      onStatusUpdated();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm pb-4">
        {/* Status colour strip */}
        <div
          className={`h-1 w-full ${getOrderStatusClass(currentStatus).split(" ")[0]}`}
        />

        <div className="p-4 space-y-3">
          {/* Row 1: ID + status badge */}
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 truncate font-mono text-xs text-slate-400">
              {order._id}
            </p>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getOrderStatusClass(currentStatus)}`}
            >
              {getOrderStatusLabel(currentStatus)}
            </span>
          </div>

          {/* Row 2: delivery address */}
          <p className="flex items-start gap-1 text-sm text-slate-600">
            <BiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E23744]" />
            <span className="line-clamp-2 leading-snug">
              {order.deliveryAddress.formattedAddress}
            </span>
          </p>

          {/* Row 3: meta chips */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-slate-500">
              <BiTimeFive className="h-3 w-3 text-[#E23744]" />
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-slate-500">
              <BiPackage className="h-3 w-3 text-[#E23744]" />
              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 font-semibold text-slate-700">
              {formatOrderPrice(order.totalAmount)}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium capitalize ${
                order.paymentStatus === "paid"
                  ? "bg-emerald-50 text-emerald-700"
                  : order.paymentStatus === "failed"
                    ? "bg-red-50 text-red-600"
                    : "bg-amber-50 text-amber-600"
              }`}
            >
              {order.paymentMethod} · {order.paymentStatus}
            </span>
          </div>

          {/* Row 4: item pills */}
          <div className="flex flex-wrap gap-1.5">
            {order.items.slice(0, 3).map((item) => (
              <span
                key={item.itemId}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
              >
                {item.quantity}× {item.name}
              </span>
            ))}
            {order.items.length > 3 && (
              <span className="rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-xs text-slate-400">
                +{order.items.length - 3} more
              </span>
            )}
          </div>

          {/* Row 5: action buttons (only when paid and restaurant can act) */}
          {order.paymentStatus === "paid" && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {actions.map((nextStatus) => (
                <button
                  key={nextStatus}
                  disabled={loading}
                  onClick={() => updateStatus(nextStatus)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${getActionButtonClass(nextStatus)}`}
                >
                  {loading
                    ? "Updating…"
                    : (ACTION_LABELS[nextStatus] ?? nextStatus)}
                </button>
              ))}
            </div>
          )}
        </div>
        {order.status === "ready_for_rider" && retryVisible && (
          <div className="flex justify-center pt-4">
            <button
              disabled={loading}
              className="rounded-lg bg-blue-500 px-4 py-2 text-white disabled:opacity-50 hover:bg-blue-600"
              onClick={() => updateStatus("ready_for_rider")}
            >
              {loading ? "Updating…" : "Retry ready for rider"}
            </button>
          </div>
        )}
      </article>
    </>
  );
};

export default OrderCard;
