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
import { formatOrderPrice } from "../utils/orderflow";

interface Props {
  currentOrder: IOrder | null;
  onStatusUpdate: () => void;
}

const getStatusLabel = (status: IOrder["status"] | undefined) => {
  if (!status) return "No active order";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
    <section aria-labelledby="current-order-heading">
      <div className="card overflow-hidden">
        <header className="bg-ink px-5 py-6 text-cream sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-cream/30 bg-tomato">
                <BiPackage className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-black tracking-[0.2em] text-mustard uppercase">
                  Live delivery
                </p>
                <h2
                  id="current-order-heading"
                  className="font-display mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl"
                >
                  Current order
                </h2>
                {currentOrder && (
                  <p className="mt-1 text-sm font-medium text-cream/70">
                    Order #{currentOrder._id.slice(-6)} ·{" "}
                    {currentOrder.restaurantName}
                  </p>
                )}
              </div>
            </div>

            <span className="sticker w-fit bg-mustard text-ink">
              {statusLabel}
            </span>
          </div>
        </header>

        {currentOrder ? (
          <>
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="card-flat !bg-cream p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-blush">
                        <BiStore className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black tracking-[0.16em] text-smoke uppercase">
                          Pickup
                        </p>
                        <p className="mt-1 truncate text-sm font-bold">
                          {currentOrder.restaurantName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="card-flat !bg-cream p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-mint">
                        <BiMapPin className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black tracking-[0.16em] text-smoke uppercase">
                          Drop-off
                        </p>
                        <p className="mt-1 text-sm leading-5 font-bold">
                          {currentOrder.deliveryAddress.formattedAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {currentOrder.deliveryAddress.mobile ? (
                  <div className="card-flat flex flex-col gap-4 !bg-skywash p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper">
                        <BiPhoneCall className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-[10px] font-black tracking-[0.16em] text-smoke uppercase">
                          Customer contact
                        </p>
                        <p className="mt-1 text-sm font-extrabold">
                          {currentOrder.deliveryAddress.mobile}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${currentOrder.deliveryAddress.mobile}`}
                      className="btn-primary !py-2 !text-xs"
                    >
                      <BiPhoneCall className="h-4 w-4" aria-hidden="true" />
                      Call customer
                    </a>
                  </div>
                ) : null}

                <div className="card-flat p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-mint">
                      <BiCheckCircle className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">Delivery progress</p>
                      <p className="mt-0.5 text-xs font-medium text-smoke">
                        Keep the order updated from pickup to drop-off.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-smoke">
                    <span className="h-3 w-3 rounded-full border-2 border-ink bg-tomato" />
                    Pickup confirmed
                    <span className="h-0.5 flex-1 bg-mist" />
                    <span
                      className={`h-3 w-3 rounded-full border-2 border-ink ${
                        status === "picked_up" || status === "delivered"
                          ? "bg-tomato"
                          : "bg-paper"
                      }`}
                    />
                    Drop-off
                  </div>
                </div>
              </div>

              <aside className="flex flex-col gap-4">
                <div className="card-flat !bg-butter flex-1 p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-paper">
                      <BiWallet className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">Delivery summary</p>
                      <p className="text-xs font-medium text-smoke">
                        Your payout for this order
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-b-2 border-ink/15 pb-3 text-sm font-medium">
                    <span className="text-smoke">Order total</span>
                    <span className="font-extrabold">
                      {formatOrderPrice(currentOrder.totalAmount)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold">Your earnings</p>
                      <p className="mt-0.5 text-xs font-medium text-smoke">
                        Added after delivery
                      </p>
                    </div>
                    <span className="font-display text-3xl font-extrabold tracking-tight text-tomato">
                      ₹{currentOrder.riderAmount}
                    </span>
                  </div>
                  {status === "delivered" && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-basil">
                      <BiCheckCircle className="h-4 w-4" /> Paid out
                    </p>
                  )}
                </div>
              </aside>
            </div>

            <footer className="flex flex-col gap-3 border-t-2 border-ink bg-cream px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-sm font-bold">
                  {canAdvance
                    ? status === "rider_assigned"
                      ? "Ready to start pickup?"
                      : "Order picked up"
                    : status === "delivered"
                      ? "Delivery completed"
                      : "Waiting for the next order update"}
                </p>
                <p className="mt-1 text-xs font-medium text-smoke">
                  {canAdvance
                    ? "Update the status when you reach the next step."
                    : "This status refreshes when the restaurant or customer updates the order."}
                </p>
              </div>
              {canAdvance ? (
                <button
                  type="button"
                  onClick={updateStatus}
                  className="btn-primary !py-3"
                >
                  {actionLabel}
                </button>
              ) : (
                <span className="chip bg-mist !px-4 !py-2">
                  {status === "delivered" ? "Completed" : "Status synced"}
                </span>
              )}
            </footer>
          </>
        ) : (
          <div className="px-5 py-12 text-center sm:px-7">
            <BiPackage className="mx-auto h-10 w-10 text-tomato" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold">No active order</p>
            <p className="mt-1 text-sm font-medium text-smoke">
              New delivery details appear here when you accept an order.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default RiderCurrentOrder;
