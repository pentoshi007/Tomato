import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useState } from "react";
import type { ICart, IRestaurant, IMenuItem } from "../types";
import { restaurantService } from "../App";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  getDeliveryFee,
  getGrandTotal,
  getAmountForFreeDelivery,
  PLATFORM_FEE,
  FREE_DELIVERY_THRESHOLD,
} from "../utils/pricing";

const getMenuItem = (item: ICart): IMenuItem | null =>
  typeof item.itemId === "object" ? item.itemId : null;

const getItemId = (item: ICart): string =>
  typeof item.itemId === "string" ? item.itemId : item.itemId._id;

const TOMATO_COLOR = "#E23744"; // Tomato logo color

const Cart = () => {
  const { cart, subTotal, fetchMyCart } = useAppContext();
  const navigate = useNavigate();
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [clearingCart, setClearingCart] = useState(false);

  if (!cart || cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500 text-center text-lg">Your cart is empty</p>
      </div>
    );
  }

  const restaurant = cart[0].restaurantId as IRestaurant;
  const deliveryFee = getDeliveryFee(subTotal);
  const platformFee = PLATFORM_FEE;
  const grandTotal = getGrandTotal(subTotal);

  const increaseQuantity = async (itemId: string) => {
    try {
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/incr`,
        { itemId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      fetchMyCart();
      toast.success("Quantity increased successfully");
    } catch (error) {
      console.log(error);
      toast.error("Problem in increasing quantity");
    } finally {
      setLoadingItemId(null);
    }
  };

  const decreaseQuantity = async (itemId: string) => {
    try {
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/decr`,
        { itemId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      fetchMyCart();
      toast.success("Quantity decreased successfully");
    } catch (error) {
      console.log(error);
      toast.error("Problem in decreasing quantity");
    } finally {
      setLoadingItemId(null);
    }
  };

  const clearCart = async () => {
    const confirm = window.confirm("Are you sure you want to clear your cart?");
    if (!confirm) return;
    try {
      setClearingCart(true);
      await axios.delete(`${restaurantService}/api/cart/clear`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchMyCart();
      toast.success("Cart cleared successfully");
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

  // Calculate amount needed for free delivery
  const amountForFreeDelivery = getAmountForFreeDelivery(subTotal);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="rounded-xl bg-white shadow-sm p-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{restaurant.name}</h2>
          <p className="text-sm text-gray-500">
            {restaurant.autoLocation.formattedAddress}
          </p>
        </div>
        <button
          onClick={() => navigate(`/restaurant/${restaurant._id}`)}
          className="shrink-0 text-sm font-semibold hover:opacity-80 transition"
          style={{ color: TOMATO_COLOR }}
        >
          Go to Menu
        </button>
      </div>
      <div className="space-y-4">
        {cart.map((item: ICart) => {
          const itemData = getMenuItem(item);
          const itemId = getItemId(item);
          return (
            <div
              key={itemId}
              className="flex items-center justify-between border-b py-3"
            >
              <div className="flex items-center gap-3">
                {itemData && (
                  <img
                    src={itemData.image}
                    alt={itemData.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-medium">
                    {itemData?.name || "Unknown Item"}
                  </div>
                  <div className="text-sm text-gray-500">
                    ₹{itemData?.price ?? ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={loadingItemId === itemId}
                  onClick={() => decreaseQuantity(itemId)}
                  className="w-7 h-7 bg-gray-200 rounded disabled:opacity-50"
                >
                  -
                </button>
                <span className="mx-2">{item.quantity}</span>
                <button
                  disabled={loadingItemId === itemId}
                  onClick={() => increaseQuantity(itemId)}
                  className="w-7 h-7 bg-gray-200 rounded disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-8 bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between mb-2">
          <span>Subtotal</span>
          <span>₹{subTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Delivery Fee</span>
          <span>
            {deliveryFee === 0 ? (
              <span style={{ color: TOMATO_COLOR, fontWeight: 600 }}>Free</span>
            ) : (
              <>₹{deliveryFee.toFixed(2)}</>
            )}
          </span>
        </div>
        {/* Show only text for 250+ order */}
        {subTotal < FREE_DELIVERY_THRESHOLD && (
          <div className="mb-2 mt-[-0.5rem]">
            <span
              className="text-sm"
              style={{ color: TOMATO_COLOR, fontWeight: 500 }}
            >
              Add items worth ₹{amountForFreeDelivery.toFixed(2)} for{" "}
              <span className="font-semibold">free delivery</span>
            </span>
          </div>
        )}
        <div className="flex justify-between mb-2">
          <span>Platform Fee</span>
          <span>₹{platformFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg mt-2 border-t pt-2">
          <span>Grand Total</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={clearCart}
            disabled={clearingCart}
            className="bg-gray-200 text-gray-800 w-40 h-15 rounded px-3 py-2 font-medium hover:bg-gray-300 transition disabled:opacity-50"
          >
            {clearingCart ? "Clearing..." : "Clear Cart"}
          </button>
          <button
            onClick={checkout}
            className={`bg-[#e00d57] text-white rounded w-full px-3 py-2 font-medium hover:bg-[#c92e64] transition ${restaurant.isOpen ? "opacity-100" : "opacity-50 cursor-not-allowed"}`}
            disabled={!restaurant.isOpen}
          >
            {restaurant.isOpen ? "Checkout" : "Restaurant is closed"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
