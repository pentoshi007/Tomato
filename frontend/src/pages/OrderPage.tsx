import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/useSocket";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { restaurantService, realtimeService } from "../config";
import { BiArrowBack, BiMapPin } from "react-icons/bi";
import type { IOrder } from "../types";
import UserOrderMap from "../components/UserOrderMap";
import {
  ORDER_PROGRESS_STEPS,
  CUSTOMER_ORDER_EVENTS,
  formatOrderDateTime,
  formatOrderPrice,
  getOrderStatusClass,
  getOrderStatusLabel,
  isActiveOrder,
} from "../utils/orderflow";

const TOMATO = "#E23744";


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
                className={`h-3 w-3 shrink-0 rounded-full transition-all ${
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

export default function OrderPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);

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

  // Drop the previous order's rider position when navigating between orders.
  useEffect(() => {
    setRiderLocation(null);
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
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-2xl space-y-3 px-4 py-8">
          <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <button
            onClick={() => navigate("/orders")}
            className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
          >
            <BiArrowBack className="h-4 w-4" /> Back to Orders
          </button>
          <p className="text-sm text-slate-500">Order not found.</p>
        </div>
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        {/* Back */}
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <BiArrowBack className="h-4 w-4" /> Back to Orders
        </button>

        {/* Header */}
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-900">
                {order.restaurantName}
              </p>
              <p className="font-mono text-xs text-slate-400">{order._id}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {formatOrderDateTime(order.createdAt)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
            >
              {getOrderStatusLabel(order.status)}
            </span>
          </div>
          {active && <ProgressBar status={order.status} />}
        </div>

        {/* Items + pricing */}
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-slate-900">Items</p>
          <ul className="space-y-2">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
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

          <div className="mt-4 space-y-1.5 border-t border-dashed border-slate-100 pt-3">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{formatOrderPrice(order.subTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Delivery fee</span>
              <span>{formatOrderPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Platform fee</span>
              <span>{formatOrderPrice(order.platformFee)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold">
              <span className="text-slate-900">Total</span>
              <span style={{ color: TOMATO }}>
                {formatOrderPrice(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-900">
            Delivery Address
          </p>
          <p className="flex items-start gap-1.5 text-sm text-slate-600">
            <BiMapPin
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: TOMATO }}
            />
            {order.deliveryAddress.formattedAddress}
          </p>
          {order.deliveryAddress.mobile && (
            <p className="mt-1 pl-5 text-xs text-slate-400">
              Mobile: {order.deliveryAddress.mobile}
            </p>
          )}
        </div>

        {/* Payment */}
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-900">Payment</p>
          <div className="flex items-center justify-between">
            <span className="text-sm capitalize text-slate-600">
              {order.paymentMethod}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                order.paymentStatus === "paid"
                  ? "bg-green-100 text-green-700"
                  : order.paymentStatus === "failed"
                    ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-700"
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
        />
      )}
    </div>
  );
}
