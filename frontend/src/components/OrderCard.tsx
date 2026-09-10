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
    <article className="card overflow-hidden">
      <div className="space-y-3 p-4">
        {/* Row 1: ID + status badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 truncate font-mono text-[10px] text-smoke">
            #{order._id}
          </p>
          <span className={`chip shrink-0 ${getOrderStatusClass(currentStatus)}`}>
            {getOrderStatusLabel(currentStatus)}
          </span>
        </div>

        {/* Row 2: delivery address */}
        <p className="flex items-start gap-1.5 text-sm font-medium">
          <BiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-tomato" />
          <span className="line-clamp-2 leading-snug">
            {order.deliveryAddress.formattedAddress}
          </span>
        </p>

        {/* Row 3: meta chips */}
        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          <span className="chip bg-paper !py-0.5">
            <BiTimeFive className="h-3 w-3 text-tomato" />
            {new Date(order.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="chip bg-paper !py-0.5">
            <BiPackage className="h-3 w-3 text-tomato" />
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </span>
          <span className="chip bg-mustard !py-0.5">
            {formatOrderPrice(order.totalAmount)}
          </span>
          <span
            className={`chip !py-0.5 capitalize ${
              order.paymentStatus === "paid"
                ? "bg-mint"
                : order.paymentStatus === "failed"
                  ? "bg-blush"
                  : "bg-butter"
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
              className="rounded-full border border-ink/25 bg-paper px-2.5 py-0.5 text-xs font-semibold"
            >
              {item.quantity}× {item.name}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="rounded-full border border-dashed border-ink/40 px-2.5 py-0.5 text-xs font-semibold text-smoke">
              +{order.items.length - 3} more
            </span>
          )}
        </div>

        {/* Row 5: action buttons (only when paid and restaurant can act) */}
        {order.paymentStatus === "paid" && actions.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t-2 border-mist pt-3">
            {actions.map((nextStatus) => (
              <button
                key={nextStatus}
                disabled={loading}
                onClick={() => updateStatus(nextStatus)}
                className={`btn !py-1.5 !text-xs shadow-pop-xs ${getActionButtonClass(nextStatus)}`}
              >
                {loading ? "Updating…" : (ACTION_LABELS[nextStatus] ?? nextStatus)}
              </button>
            ))}
          </div>
        )}
      </div>

      {order.status === "ready_for_rider" && retryVisible && (
        <div className="flex justify-center border-t-2 border-dashed border-mist p-3">
          <button
            disabled={loading}
            className="btn-secondary !py-1.5 !text-xs"
            onClick={() => updateStatus("ready_for_rider")}
          >
            {loading ? "Updating…" : "Retry ready for rider"}
          </button>
        </div>
      )}
    </article>
  );
};

export default OrderCard;
