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
import { BiMapPin, BiRefresh, BiChevronRight } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { EmptyState, Skeleton } from "../components/ui/primitives";
import { SteamBowl } from "../components/ui/illustrations";

function ProgressBar({ status }: { status: IOrder["status"] }) {
  const currentIdx = ORDER_PROGRESS_STEPS.indexOf(status);
  if (status === "cancelled" || currentIdx < 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center">
        {ORDER_PROGRESS_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step} className="flex flex-1 items-center">
              <div
                className={`relative flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-ink transition-colors ${
                  done ? "bg-tomato" : "bg-paper"
                }`}
              >
                {isCurrent && (
                  <span className="animate-ping-dot absolute inset-0 rounded-full bg-tomato" />
                )}
              </div>
              {i < ORDER_PROGRESS_STEPS.length - 1 && (
                <div
                  className={`h-1 flex-1 border-y border-ink transition-colors ${
                    i < currentIdx ? "bg-tomato" : "bg-mist"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-bold tracking-wide text-smoke uppercase">
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
      className="card card-hover cursor-pointer overflow-hidden"
      onClick={() => navigate(`/order/${order._id}`)}
    >
      <div className="flex items-center justify-between gap-3 border-b-2 border-ink px-4 py-3">
        <div className="min-w-0">
          <p className="font-display truncate text-base font-bold">
            {order.restaurantName}
          </p>
          <p className="truncate font-mono text-[10px] text-smoke">
            #{order._id}
          </p>
        </div>
        <span className={`chip shrink-0 ${statusClass}`}>
          {getOrderStatusLabel(order.status)}
        </span>
      </div>

      <div className="px-4 pt-3">
        <ul className="space-y-1">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {item.name}
                <span className="ml-1 text-xs font-bold text-smoke">
                  × {item.quantity}
                </span>
              </span>
              <span className="font-bold text-smoke">
                {formatOrderPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-2 flex items-center justify-between border-t-2 border-dashed border-mist pt-2">
          <span className="text-xs font-medium text-smoke">
            {formatOrderDateTime(order.createdAt)}
          </span>
          <span className="font-display text-base font-extrabold text-tomato">
            {formatOrderPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      {!isDelivered && (
        <div className="px-4 pb-4">
          <ProgressBar status={order.status} />
        </div>
      )}

      <div className="border-t-2 border-ink bg-butter px-4 py-2.5">
        <p className="flex items-start gap-1.5 text-xs font-semibold">
          <BiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tomato" />
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
    <article className="card-flat card-hover overflow-hidden">
      <button
        type="button"
        onClick={() => navigate(`/order/${order._id}`)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{order.restaurantName}</p>
          <p className="mt-0.5 truncate text-xs font-medium text-smoke">
            {summarizeOrderItems(order.items)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`chip !px-2 !py-0.5 !text-[10px] ${statusClass}`}>
            {getOrderStatusLabel(order.status)}
          </span>
          <span className="text-sm font-extrabold">
            {formatOrderPrice(order.totalAmount)}
          </span>
          <BiChevronRight className="h-4 w-4 text-smoke" />
        </div>
      </button>
    </article>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <Skeleton key={n} className="h-36 w-full !rounded-2xl" />
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
    const onRiderAssigned = () => {
      void fetchOrders();
    };
    socket.on("order:rider_assigned", onRiderAssigned);
    return () => {
      CUSTOMER_ORDER_EVENTS.forEach((event) => socket.off(event, syncOrders));
      socket.off("order:rider_assigned", onRiderAssigned);
    };
  }, [socket, fetchOrders]);

  const activeOrders = orders.filter(isActiveOrder);
  const pastOrders = orders.filter((order) => !isActiveOrder(order));
  const orderSummary =
    orders.length === 0
      ? "No orders yet"
      : `${activeOrders.length} active · ${pastOrders.length} past`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-widest text-tomato uppercase">
            {user?.name ?? "Account"}
          </p>
          <h1 className="font-display mt-0.5 text-3xl font-extrabold tracking-tight">
            Your orders
          </h1>
          <p className="mt-1 text-sm font-medium text-smoke">{orderSummary}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchOrders()}
          disabled={loading}
          className="btn-secondary !py-1.5 !text-xs"
        >
          <BiRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<SteamBowl size={64} />}
          title="No orders yet"
          body="Your paid orders will land here, hot off the pass."
        />
      ) : (
        <div className="space-y-8">
          {activeOrders.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-xs font-black tracking-widest text-smoke uppercase">
                  Active
                </h2>
                <span className="chip bg-tomato text-white">
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
                <h2 className="text-xs font-black tracking-widest text-smoke uppercase">
                  Past
                </h2>
                <span className="chip bg-mist">{pastOrders.length}</span>
              </div>
              <div className="space-y-2.5">
                {pastOrders.map((order) => (
                  <PastOrderRow key={order._id} order={order} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
