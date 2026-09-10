import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/useSocket";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { restaurantService, realtimeService } from "../config";
import { BiArrowBack, BiMapPin, BiPhone } from "react-icons/bi";
import type { IOrder, IOrderRoute } from "../types";
import UserOrderMap, { type LiveRoute } from "../components/UserOrderMap";
import {
  ORDER_PROGRESS_STEPS,
  CUSTOMER_ORDER_EVENTS,
  formatOrderDateTime,
  formatOrderPrice,
  getOrderStatusClass,
  getOrderStatusLabel,
  isActiveOrder,
} from "../utils/orderflow";
import { Skeleton, EmptyState } from "../components/ui/primitives";
import { TomatoMark } from "../components/ui/Logo";

const toLiveRoute = (route: IOrderRoute | null | undefined): LiveRoute | null => {
  if (!route) return null;
  if (route.phase !== "pickup" && route.phase !== "delivery") return null;
  if (!Array.isArray(route.path) || route.path.length < 2) return null;
  const startedAt =
    typeof route.startedAt === "number"
      ? route.startedAt
      : Date.parse(String(route.startedAt));
  if (!Number.isFinite(startedAt)) return null;
  if (!Number.isFinite(route.durationMs) || route.durationMs <= 0) return null;
  return {
    phase: route.phase,
    path: route.path,
    startedAt,
    durationMs: route.durationMs,
  };
};

function ProgressBar({ status }: { status: IOrder["status"] }) {
  const currentIdx = ORDER_PROGRESS_STEPS.indexOf(status);
  if (status === "cancelled" || currentIdx < 0) return null;
  return (
    <div className="mt-4">
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

export default function OrderPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);
  const [socketRoute, setSocketRoute] = useState<IOrderRoute | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${restaurantService}/api/order/${orderId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setOrder(data.order);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  // The realtime server joins every authenticated socket to user:<userId>
  // (from the JWT) at connect time, so no manual join/leave is needed here.
  useEffect(() => {
    if (!socket || !orderId) return;

    // order:new / order:update send { orderId, status }; order:rider_assigned
    // sends the full order document, so match on either id field.
    const onUpdate = (payload: { orderId?: string; _id?: string }) => {
      const eventOrderId = payload?.orderId ?? payload?._id;
      if (!eventOrderId || eventOrderId === orderId) void fetchOrder();
    };
    const events = [...CUSTOMER_ORDER_EVENTS, "order:rider_assigned"];
    events.forEach((e) => socket.on(e, onUpdate));
    return () => {
      events.forEach((e) => socket.off(e, onUpdate));
    };
  }, [socket, orderId, fetchOrder]);

  useEffect(() => {
    if (!socket || !orderId) return;
    const onRiderLocation = (payload: {
      orderId?: string;
      latitude: number;
      longitude: number;
    }) => {
      // Rider clients built before orderId was added to the payload emit
      // without it — accept those as-is.
      if (payload.orderId && payload.orderId !== orderId) return;
      setRiderLocation([payload.latitude, payload.longitude]);
    };
    socket.on("rider:location", onRiderLocation);
    return () => {
      socket.off("rider:location", onRiderLocation);
    };
  }, [socket, orderId]);

  useEffect(() => {
    if (!socket || !orderId) return;
    const onRiderRoute = (payload: (IOrderRoute & { orderId?: string }) | null) => {
      if (!payload?.orderId || payload.orderId !== orderId) return;
      setSocketRoute(payload);
    };
    socket.on("rider:route", onRiderRoute);
    return () => {
      socket.off("rider:route", onRiderRoute);
    };
  }, [socket, orderId]);

  // Drop the previous order's rider position when navigating between orders.
  useEffect(() => {
    setRiderLocation(null);
    setSocketRoute(null);
  }, [orderId]);

  // Seed the rider's last known position so the map renders immediately on
  // open; live rider:location socket events keep it fresh every ~10s.
  useEffect(() => {
    if (!orderId) return;
    if (order?.status !== "rider_assigned" && order?.status !== "picked_up") {
      return;
    }

    let isActive = true;
    void axios
      .get(`${realtimeService}/api/internal/rider-location/${orderId}`, {
        headers: {
          "x-internal-key": import.meta.env.VITE_INTERNAL_SERVICE_KEY,
        },
      })
      .then(({ data }) => {
        if (
          !isActive ||
          typeof data?.latitude !== "number" ||
          typeof data?.longitude !== "number"
        ) {
          return;
        }
        // Keep a fresher socket update if one already arrived.
        setRiderLocation((prev) => prev ?? [data.latitude, data.longitude]);
      })
      .catch(() => {
        // No cached location yet — the next live emit fills it in.
      });

    return () => {
      isActive = false;
    };
  }, [orderId, order?.status]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-36 w-full !rounded-2xl" />
        <Skeleton className="h-48 w-full !rounded-2xl" />
        <Skeleton className="h-28 w-full !rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <button
          onClick={() => navigate("/orders")}
          className="btn-ghost mb-6 !px-3 !py-1.5 !text-xs"
        >
          <BiArrowBack className="h-4 w-4" /> Back to orders
        </button>
        <EmptyState
          icon={<TomatoMark size={48} />}
          title="Order not found"
          body="This order may have been removed or the link is wrong."
        />
      </div>
    );
  }

  const active = isActiveOrder(order);
  const statusClass = getOrderStatusClass(order.status);
  const { latitude, longitude } = order.deliveryAddress;
  const deliveryLocation: [number, number] | null =
    Number.isFinite(latitude) && Number.isFinite(longitude)
      ? [latitude, longitude]
      : null;
  const route = toLiveRoute(socketRoute ?? order.activeRoute ?? null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button
        onClick={() => navigate("/orders")}
        className="btn-ghost mb-5 !px-3 !py-1.5 !text-xs"
      >
        <BiArrowBack className="h-4 w-4" /> Back to orders
      </button>

      <div className="space-y-4">
        {/* Status header */}
        <div className="card px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display truncate text-lg font-bold">
                {order.restaurantName}
              </p>
              <p className="truncate font-mono text-[10px] text-smoke">
                #{order._id}
              </p>
              <p className="mt-0.5 text-xs font-medium text-smoke">
                {formatOrderDateTime(order.createdAt)}
              </p>
            </div>
            <span className={`chip shrink-0 ${statusClass}`}>
              {getOrderStatusLabel(order.status)}
            </span>
          </div>
          {active && <ProgressBar status={order.status} />}
          {order.riderName && active && (
            <p className="mt-3 flex items-center gap-1.5 rounded-lg border-2 border-ink bg-mint px-3 py-2 text-xs font-bold">
              <BiPhone className="h-3.5 w-3.5" />
              {order.riderName}
              {order.riderPhone ? ` · ${order.riderPhone}` : ""} is on it
            </p>
          )}
        </div>

        {/* Items + pricing */}
        <div className="card px-4 py-4">
          <p className="font-display mb-3 text-sm font-bold tracking-wide uppercase">
            Items
          </p>
          <ul className="space-y-2">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
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

          <div className="mt-4 space-y-1.5 border-t-2 border-dashed border-mist pt-3">
            <div className="flex justify-between text-sm font-medium text-smoke">
              <span>Subtotal</span>
              <span>{formatOrderPrice(order.subTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-smoke">
              <span>Delivery fee</span>
              <span>{formatOrderPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-smoke">
              <span>Platform fee</span>
              <span>{formatOrderPrice(order.platformFee)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-ink pt-2 text-sm font-extrabold">
              <span>Total</span>
              <span className="text-tomato">
                {formatOrderPrice(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div className="card px-4 py-4">
          <p className="font-display mb-2 text-sm font-bold tracking-wide uppercase">
            Delivering to
          </p>
          <p className="flex items-start gap-1.5 text-sm font-medium">
            <BiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-tomato" />
            {order.deliveryAddress.formattedAddress}
          </p>
          {order.deliveryAddress.mobile && (
            <p className="mt-1 pl-5.5 text-xs font-medium text-smoke">
              Mobile: {order.deliveryAddress.mobile}
            </p>
          )}
        </div>

        {/* Payment */}
        <div className="card px-4 py-4">
          <p className="font-display mb-2 text-sm font-bold tracking-wide uppercase">
            Payment
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold capitalize">
              {order.paymentMethod}
            </span>
            <span
              className={`chip ${
                order.paymentStatus === "paid"
                  ? "bg-mint"
                  : order.paymentStatus === "failed"
                    ? "bg-blush"
                    : "bg-butter"
              }`}
            >
              {order.paymentStatus.charAt(0).toUpperCase() +
                order.paymentStatus.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {(order.status === "rider_assigned" || order.status === "picked_up") && (
        <UserOrderMap
          riderLocation={riderLocation}
          deliveryLocation={deliveryLocation}
          route={route}
          restaurantName={order.restaurantName}
        />
      )}
    </div>
  );
}
