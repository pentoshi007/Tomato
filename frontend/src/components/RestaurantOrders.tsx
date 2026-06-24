import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  BiBell,
  BiRefresh,
} from "react-icons/bi";
import { useSocket } from "../context/useSocket";
import type { IOrder } from "../types";
import { restaurantService } from "../App";
import OrderCard from "./OrderCard";

const audio = "/sounds/quack.mp3";

const ACTIVE_STATUS: IOrder["status"][] = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const STATUS_LABEL: Record<IOrder["status"], string> = {
  placed: "Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready_for_rider: "Ready for Rider",
  rider_assigned: "Rider Assigned",
  picked_up: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const RestaurantOrders = ({ restaurantId }: { restaurantId: string }) => {
  const { socket } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Initialize audio once at mount, independent of socket
  useEffect(() => {
    audioRef.current = new Audio(audio);
    audioRef.current.preload = "auto";
    audioRef.current.load();
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/order/${restaurantId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    const onNewOrder = () => {
      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.log);
      }
      void fetchOrders();
    };
    socket.on("order:new", onNewOrder);
    return () => {
      socket.off("order:new", onNewOrder);
    };
  }, [socket, audioUnlocked, fetchOrders]);

  const unlockAudio = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioUnlocked(true);
    } catch (error) {
      console.log("Audio unlock failed:", error);
      setAudioUnlocked(false);
    }
  };

  const activeOrders = orders.filter((o) => ACTIVE_STATUS.includes(o.status));
  const completedOrders = orders.filter(
    (o) => !ACTIVE_STATUS.includes(o.status),
  );

  return (
    <section className="rounded-3xl border border-rose-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E23744]">
            Live orders
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">
            Order board
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {loading
              ? "Fetching latest orders…"
              : `${activeOrders.length} active · ${completedOrders.length} completed`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void fetchOrders()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-[#E23744] hover:text-[#E23744] disabled:opacity-50"
          >
            <BiRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {!audioUnlocked ? (
            <button
              type="button"
              onClick={unlockAudio}
              className="inline-flex items-center gap-2 rounded-full bg-[#E23744] px-4 py-2 text-sm font-medium text-white hover:bg-[#d92d67]"
            >
              <BiBell className="h-4 w-4" />
              Enable sound
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Sound on
            </div>
          )}
        </div>
      </div>

      {/* Order columns */}
      <div className="grid gap-5 p-5 xl:grid-cols-2">
        {/* Active */}
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
              Active
            </h4>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#E23744]">
              {activeOrders.length}
            </span>
          </div>

          {loading && orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
              Loading orders…
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
              No active orders right now.
            </div>
          ) : (
            activeOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                statusLabel={STATUS_LABEL[order.status]}
              />
            ))
          )}
        </div>

        {/* Completed */}
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
              Completed
            </h4>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {completedOrders.length}
            </span>
          </div>

          {completedOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
              No completed orders yet.
            </div>
          ) : (
            completedOrders.slice(0, 10).map((order) => (
              <article
                key={order._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-slate-900">
                    {order._id}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === "delivered"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                    <p className="text-sm font-semibold text-[#E23744]">
                      ₹{order.totalAmount}
                    </p>
                  </div>
                </div>
                <p className="mt-1.5 text-sm text-slate-500">
                  {order.deliveryAddress.formattedAddress}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                  <span className="capitalize">
                    {order.paymentMethod} · {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default RestaurantOrders;
