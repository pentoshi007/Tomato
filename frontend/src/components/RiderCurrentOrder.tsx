import axios from "axios";
import { toast } from "react-hot-toast";
import {
  BiCheckCircle,
  BiMapPin,
  BiPackage,
  BiPhoneCall,
  BiStore,
  BiWallet,
} from "react-icons/bi";
import { riderService } from "../config";
import type { IOrder } from "../types";

interface Props {
  currentOrder: IOrder | null;
  onStatusUpdate: () => void;
}

const getStatusLabel = (status: IOrder["status"] | undefined) => {
  if (!status) return "No active order";

  return status
    .replace(/_/g, " ")
    .replace(/\\b\\w/g, (letter) => letter.toUpperCase());
};

const RiderCurrentOrder = ({ currentOrder, onStatusUpdate }: Props) => {
  const updateStatus = async () => {
    if (!currentOrder) return;

    try {
      await axios.put(
        `${riderService}/api/rider/order/update/${currentOrder._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success("Order status updated");
      onStatusUpdate();
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to update order status"
        : "Failed to update order status";
      toast.error(message);
    }
  };

  const status = currentOrder?.status;
  const statusLabel = getStatusLabel(status);
  const canAdvance = status === "rider_assigned" || status === "picked_up";
  const actionLabel =
    status === "rider_assigned" ? "Reached restaurant" : "Mark as delivered";

  return (
    <section
      aria-labelledby="current-order-heading"
      className="mx-auto mt-6 w-full max-w-6xl px-4 pb-6"
    >
      <div className="overflow-hidden rounded-[28px] border border-[#f7d0dc] bg-white shadow-sm">
        <header className="bg-linear-to-r from-[#E23774] via-[#ef4b84] to-[#f68caf] px-5 py-6 text-white sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <BiPackage className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                  Live delivery
                </p>
                <h2
                  id="current-order-heading"
                  className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
                >
                  Current order
                </h2>
                {currentOrder && (
                  <p className="mt-1 text-sm text-white/80">
                    Order #{currentOrder._id.slice(-6)} · {currentOrder.restaurantName}
                  </p>
                )}
              </div>
            </div>

            <span className="inline-flex w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#a81854] shadow-sm">
              {statusLabel}
            </span>
          </div>
        </header>

        {currentOrder ? (
          <>
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#E23774] shadow-sm ring-1 ring-[#f7d0dc]">
                        <BiStore className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                          Pickup
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                          {currentOrder.restaurantName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#E23774] shadow-sm ring-1 ring-[#f7d0dc]">
                        <BiMapPin className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                          Drop-off
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-5 text-gray-900">
                          {currentOrder.deliveryAddress.formattedAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {currentOrder.deliveryAddress.mobile && (
                  <div className="flex flex-col gap-4 rounded-2xl border border-[#f7d0dc] bg-[#fff7fa] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#E23774] shadow-sm ring-1 ring-[#f7d0dc]">
                        <BiPhoneCall className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                          Customer contact
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {currentOrder.deliveryAddress.mobile}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${currentOrder.deliveryAddress.mobile}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E23774] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d91f66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E23774] focus-visible:ring-offset-2"
                    >
                      <BiPhoneCall className="h-4 w-4" aria-hidden="true" />
                      Call customer
                    </a>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff7fa] text-[#E23774] ring-1 ring-[#f7d0dc]">
                      <BiCheckCircle className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Delivery progress
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Keep the order updated as you move from pickup to drop-off.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E23774]" />
                    Pickup confirmed
                    <span className="h-px flex-1 bg-gray-200" />
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        status === "picked_up" || status === "delivered"
                          ? "bg-[#E23774]"
                          : "bg-gray-200"
                      }`}
                    />
                    Drop-off
                  </div>
                </div>
              </div>

              <aside className="rounded-2xl bg-[#fff7fa] p-5 ring-1 ring-[#f7d0dc]">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#E23774] shadow-sm ring-1 ring-[#f7d0dc]">
                    <BiWallet className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Delivery summary
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Your payout for this order
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between gap-4 border-b border-[#f7d0dc] pb-4 text-sm">
                    <span className="text-gray-500">Order total</span>
                    <span className="font-semibold text-gray-900">
                      ₹{currentOrder.totalAmount}
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Your earnings
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Added after delivery
                      </p>
                    </div>
                    <span className="text-3xl font-bold tracking-tight text-[#E23774]">
                      ₹{currentOrder.riderAmount}
                    </span>
                  </div>
                </div>
              </aside>
            </div>

            <footer className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {canAdvance
                    ? status === "rider_assigned"
                      ? "Ready to start pickup?"
                      : "Order picked up"
                    : status === "delivered"
                      ? "Delivery completed"
                      : "Waiting for the next order update"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {canAdvance
                    ? "Update the status when you reach the next step."
                    : "This status will refresh when the restaurant or customer updates the order."}
                </p>
              </div>
              {canAdvance ? (
                <button
                  type="button"
                  onClick={updateStatus}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#E23774] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d91f66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E23774] focus-visible:ring-offset-2 sm:w-auto"
                >
                  {actionLabel}
                </button>
              ) : (
                <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-500 ring-1 ring-gray-200">
                  {status === "delivered" ? "Completed" : "Status synced"}
                </span>
              )}
            </footer>
          </>
        ) : (
          <div className="px-5 py-12 text-center sm:px-7">
            <BiPackage className="mx-auto h-10 w-10 text-[#E23774]" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-gray-900">
              No active order
            </p>
            <p className="mt-1 text-sm text-gray-500">
              New delivery details will appear here when you accept an order.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default RiderCurrentOrder;
