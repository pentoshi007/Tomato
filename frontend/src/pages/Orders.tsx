import {
  CUSTOMER_ORDER_EVENTS,
  ORDER_PROGRESS_STEPS,
  formatOrderDateTime,
  formatOrderPrice,
  getOrderStatusClass,
  getOrderStatusLabel,
  isActiveOrder,
  summarizeOrderItems,
} from "../utils/orderflow";
import type { IOrder } from "../types";
import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../context/useSocket";
import { restaurantService } from "../config";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { BiMapPin, BiPackage, BiRefresh, BiChevronRight } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

const TOMATO = "#E23744";
function ProgressBar({ status }: { status: IOrder["status"] }) {
  const currentIdx = ORDER_PROGRESS_STEPS.indexOf(status);
  if (status === "cancelled" || currentIdx < 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-0">
        {ORDER_PROGRESS_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step} className="flex flex-1 items-center">
              <div
                className={`relative flex h-3 w-3 shrink-0 items-center justify-center rounded-full transition-all ${
                  done ? "bg-[#E23744]" : "border border-slate-300 bg-white"
                } ${isCurrent ? "ring-4 ring-rose-100" : ""}`}
              />
              {i < ORDER_PROGRESS_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-all ${
                    i < currentIdx ? "bg-[#E23744]" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        <span>Placed</span>
        <span>On the way</span>
        <span>Delivered</span>
      </div>
    </div>
  );
}

function ActiveOrderCard({ order }: { order: IOrder }) {
  const statusClass = getOrderStatusClass(order.status);
  const isDelivered = order.status === "delivered";
  const navigate = useNavigate();

  return (
    <article
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm cursor-pointer hover:border-[#E23744] hover:shadow-md transition-all"
      onClick={() => navigate(`/order/${order._id}`)}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {order.restaurantName}
          </p>
          <p className="font-mono text-xs text-slate-400">{order._id}</p>
        </div>
        <span
          className={`ml-3 shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
        >
          {getOrderStatusLabel(order.status)}
        </span>
      </div>

      <div className="px-4 pt-3">
        <ul className="space-y-1">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {item.name}
                <span className="ml-1 text-xs text-slate-400">
                  × {item.quantity}
                </span>
              </span>
              <span className="text-slate-500">
                {formatOrderPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-2 flex items-center justify-between border-t border-dashed border-slate-100 pt-2">
          <span className="text-xs text-slate-400">
            {formatOrderDateTime(order.createdAt)}
          </span>
          <span className="text-sm font-bold text-[#E23744]">
            {formatOrderPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      {!isDelivered && (
        <div className="px-4 pb-4">
          <ProgressBar status={order.status} />
        </div>
      )}

      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
        <p className="flex items-start gap-1.5 text-xs text-slate-500">
          <BiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E23744]" />
          <span className="line-clamp-1">
            {order.deliveryAddress.formattedAddress}
          </span>
        </p>
      </div>
    </article>
  );
}

function PastOrderRow({ order }: { order: IOrder }) {
  const statusClass = getOrderStatusClass(order.status);
  const navigate = useNavigate();

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => navigate(`/order/${order._id}`)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {order.restaurantName}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {summarizeOrderItems(order.items)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}
          >
            {getOrderStatusLabel(order.status)}
          </span>
          <span className="text-sm font-bold text-slate-900">
            {formatOrderPrice(order.totalAmount)}
          </span>
          <BiChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </button>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-28 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAppContext();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${restaurantService}/api/order/my`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setOrders(data.orders ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    const syncOrders = () => {
      void fetchOrders();
    };
    CUSTOMER_ORDER_EVENTS.forEach((event) => socket.on(event, syncOrders));
    return () => {
      CUSTOMER_ORDER_EVENTS.forEach((event) => socket.off(event, syncOrders));
    };
  }, [socket, fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    const onUpdateOrder = () => {
      fetchOrders();
    };
    socket.on("order:rider_assigned", onUpdateOrder);
    return () => {
      socket.off("order:rider_assigned", onUpdateOrder);
    };
  }, [socket, fetchOrders]);

  const activeOrders = orders.filter(isActiveOrder);
  const pastOrders = orders.filter((order) => !isActiveOrder(order));
  const orderSummary =
    orders.length === 0
      ? "No orders yet"
      : `${activeOrders.length} active · ${pastOrders.length} past`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: TOMATO }}
            >
              {user?.name ?? "Account"}
            </p>
            <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Orders</h1>
            <p className="mt-1 text-sm text-slate-500">{orderSummary}</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchOrders()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[#E23744] hover:text-[#E23744] disabled:opacity-50"
          >
            <BiRefresh
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {loading && orders.length === 0 ? (
          <Skeleton />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: "#fef2f2" }}
            >
              <BiPackage className="h-8 w-8" style={{ color: TOMATO }} />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">
              No orders yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Paid orders appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeOrders.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                    Active
                  </h2>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: TOMATO }}
                  >
                    {activeOrders.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <ActiveOrderCard key={order._id} order={order} />
                  ))}
                </div>
              </section>
            )}

            {pastOrders.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                    Past
                  </h2>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {pastOrders.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {pastOrders.map((order) => (
                    <PastOrderRow key={order._id} order={order} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
