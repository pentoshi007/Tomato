import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useState } from "react";
import type { ICart, IRestaurant, IMenuItem } from "../types";
import { restaurantService } from "../config";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  getDeliveryFee,
  getGrandTotal,
  getAmountForFreeDelivery,
  PLATFORM_FEE,
  FREE_DELIVERY_THRESHOLD,
} from "../utils/pricing";
import { BiMinus, BiPlus, BiTrash, BiArrowBack } from "react-icons/bi";
import { FoodImage } from "../components/ui/FoodImage";
import { EmptyState, Spinner } from "../components/ui/primitives";
import { Fries } from "../components/ui/illustrations";

const getMenuItem = (item: ICart): IMenuItem | null =>
  typeof item.itemId === "object" ? item.itemId : null;

const getItemId = (item: ICart): string =>
  typeof item.itemId === "string" ? item.itemId : item.itemId._id;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const Cart = () => {
  const { cart, subTotal, fetchMyCart } = useAppContext();
  const navigate = useNavigate();
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [clearingCart, setClearingCart] = useState(false);

  if (!cart || cart.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <EmptyState
          icon={<Fries size={72} />}
          title="Your cart is hungry"
          body="Add something delicious and it will show up here."
          action={
            <button onClick={() => navigate("/")} className="btn-primary">
              Browse food
            </button>
          }
        />
      </div>
    );
  }

  const restaurant = cart[0].restaurantId as IRestaurant;
  const deliveryFee = getDeliveryFee(subTotal);
  const platformFee = PLATFORM_FEE;
  const grandTotal = getGrandTotal(subTotal);
  const amountForFreeDelivery = getAmountForFreeDelivery(subTotal);
  const freeDeliveryProgress = Math.min(100, (subTotal / FREE_DELIVERY_THRESHOLD) * 100);

  const changeQuantity = async (itemId: string, direction: "incr" | "decr") => {
    try {
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/${direction}`,
        { itemId },
        { headers: authHeaders() },
      );
      fetchMyCart();
    } catch (error) {
      console.log(error);
      toast.error("Problem in updating quantity");
    } finally {
      setLoadingItemId(null);
    }
  };

  const clearCart = async () => {
    const confirm = window.confirm("Clear your whole cart?");
    if (!confirm) return;
    try {
      setClearingCart(true);
      await axios.delete(`${restaurantService}/api/cart/clear`, {
        headers: authHeaders(),
      });
      fetchMyCart();
      toast.success("Cart cleared");
    } catch (error) {
      console.log(error);
      toast.error("Problem in clearing cart");
    } finally {
      setClearingCart(false);
    }
  };

  const checkout = () => {
    navigate("/checkout", { state: { cart } });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-32 md:pb-10">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary !rounded-full !p-2"
          aria-label="Go back"
        >
          <BiArrowBack className="h-5 w-5" />
        </button>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Your tray
        </h1>
        <span className="chip bg-mustard">{cart.length} items</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="card-flat flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-xs font-black tracking-widest text-smoke uppercase">
                Ordering from
              </p>
              <h2 className="font-display mt-1 truncate text-lg font-bold">
                {restaurant.name}
              </h2>
              <p className="truncate text-xs font-medium text-smoke">
                {restaurant.autoLocation.formattedAddress}
              </p>
            </div>
            <button
              onClick={() => navigate(`/restaurant/${restaurant._id}`)}
              className="btn-secondary shrink-0 !py-1.5 !text-xs"
            >
              Add more
            </button>
          </div>

          {cart.map((item: ICart) => {
            const itemData = getMenuItem(item);
            const itemId = getItemId(item);
            const busy = loadingItemId === itemId;
            return (
              <div
                key={itemId}
                className="card-flat flex items-center gap-4 p-4"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-ink">
                  <FoodImage
                    src={itemData?.image}
                    alt={itemData?.name ?? "Item"}
                    width={200}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold">
                    {itemData?.name || "Unknown item"}
                  </h3>
                  <p className="text-xs font-semibold text-smoke">
                    ₹{itemData?.price ?? ""} each
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-tomato">
                    ₹{((itemData?.price ?? 0) * item.quantity).toFixed(0)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-paper p-1 shadow-pop-xs">
                  <button
                    disabled={busy}
                    onClick={() => changeQuantity(itemId, "decr")}
                    className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-mist disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    {busy ? <Spinner size={12} /> : <BiMinus className="h-4 w-4" />}
                  </button>
                  <span className="w-6 text-center text-sm font-black">
                    {item.quantity}
                  </span>
                  <button
                    disabled={busy}
                    onClick={() => changeQuantity(itemId, "incr")}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-tomato text-white transition-colors hover:bg-tomato-deep disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    {busy ? <Spinner size={12} className="text-white" /> : <BiPlus className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={clearCart}
            disabled={clearingCart}
            className="btn-danger-ghost !text-xs"
          >
            <BiTrash className="h-4 w-4" />
            {clearingCart ? "Clearing…" : "Clear tray"}
          </button>
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold">The bill</h2>

          <div className="mt-4 space-y-2.5 text-sm font-medium">
            <div className="flex justify-between">
              <span className="text-smoke">Subtotal</span>
              <span className="font-bold">₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-smoke">Delivery fee</span>
              {deliveryFee === 0 ? (
                <span className="font-black text-basil">FREE</span>
              ) : (
                <span className="font-bold">₹{deliveryFee.toFixed(2)}</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-smoke">Platform fee</span>
              <span className="font-bold">₹{platformFee.toFixed(2)}</span>
            </div>
          </div>

          {subTotal < FREE_DELIVERY_THRESHOLD && (
            <div className="mt-4 rounded-xl border-2 border-dashed border-ink bg-butter p-3">
              <p className="text-xs font-bold">
                Add ₹{amountForFreeDelivery.toFixed(0)} more for{" "}
                <span className="text-tomato">free delivery</span>
              </p>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full border border-ink bg-paper">
                <div
                  className="h-full bg-mustard transition-all duration-500"
                  style={{ width: `${freeDeliveryProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-between border-t-2 border-ink pt-3">
            <span className="font-display text-lg font-bold">Total</span>
            <span className="font-display text-lg font-extrabold text-tomato">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>

          <button
            onClick={checkout}
            className="btn-primary mt-4 hidden w-full !py-3 lg:flex"
            disabled={!restaurant.isOpen}
          >
            {restaurant.isOpen ? "Go to checkout" : "Restaurant is closed"}
          </button>
        </aside>
      </div>

      {/* Sticky checkout bar — mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        <button
          onClick={checkout}
          disabled={!restaurant.isOpen}
          className="btn-primary w-full !py-3"
        >
          {restaurant.isOpen
            ? `Checkout · ₹${grandTotal.toFixed(0)}`
            : "Restaurant is closed"}
        </button>
      </div>
    </div>
  );
};

export default Cart;
