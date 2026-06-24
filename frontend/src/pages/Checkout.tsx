import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { IAddress, IRestaurant, ICart, IMenuItem } from "../types";
import { restaurantService, utilsService } from "../App";
import toast from "react-hot-toast";
import { getDistanceKm } from "../utils/getDistanceKm";
import {
  getDeliveryFee,
  getGrandTotal,
  getAmountForFreeDelivery,
  PLATFORM_FEE,
  FREE_DELIVERY_THRESHOLD,
} from "../utils/pricing";
const TOMATO_COLOR = "#E23744";

const getMenuItem = (item: ICart): IMenuItem | null =>
  typeof item.itemId === "object" ? item.itemId : null;

const getItemId = (item: ICart): string =>
  typeof item.itemId === "string" ? item.itemId : item.itemId._id;

// Razorpay SVG logo
const RazorpayLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#2D81F7" />
    <path
      d="M7 17L10.5 7H13L15 13.5L17 7H19.5L16.5 17H14L12 10.5L10 17H7Z"
      fill="white"
    />
  </svg>
);

// Stripe SVG logo
const StripeLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#635BFF" />
    <path
      d="M11.5 9.5C11.5 8.95 11.95 8.6 12.6 8.6C13.55 8.6 14.5 9.05 15.2 9.7L16.5 7.8C15.5 7 14.1 6.5 12.6 6.5C10.35 6.5 8.8 7.75 8.8 9.65C8.8 13.15 13.7 12.5 13.7 14.15C13.7 14.8 13.15 15.2 12.35 15.2C11.2 15.2 10.1 14.65 9.3 13.8L8 15.7C9 16.7 10.6 17.5 12.35 17.5C14.7 17.5 16.35 16.25 16.35 14.1C16.35 10.45 11.5 11.2 11.5 9.5Z"
      fill="white"
    />
  </svg>
);

export default function CheckoutPage() {
  const navigate = useNavigate();

  const { cart, subTotal, quantity, fetchMyCart } = useAppContext();
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [selectedPayment, setSelectedPayment] = useState<"razorpay" | "stripe">(
    "razorpay",
  );
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  

  useEffect(() => {
    async function fetchAddresses() {
      if (!cart || cart.length === 0) return;
      try {
        setLoadingAddresses(true);
        const { data } = await axios.get(
          `${restaurantService}/api/address/get`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const fetched = (data.addresses as IAddress[]) || [];
        setAddresses(fetched);
        if (fetched.length > 0) setSelectedAddressId(fetched[0]._id);
      } catch (error) {
        console.log(error);
      } finally {
        setLoadingAddresses(false);
      }
    }
    fetchAddresses();
  }, [cart]);

  if (!cart || cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500 text-center text-lg">Your cart is empty</p>
      </div>
    );
  }

  const restaurant = cart[0]?.restaurantId as IRestaurant;
  const deliveryFee = getDeliveryFee(subTotal);
  const platformFee = PLATFORM_FEE;
  const grandTotal = getGrandTotal(subTotal);
  const amountForFreeDelivery = getAmountForFreeDelivery(subTotal);

  const createOrder = async (paymentMethod: "razorpay" | "stripe") => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return null;
    }
    const selectedAddress = addresses.find(
      (addr) => addr._id === selectedAddressId,
    );
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return null;
    }
    const [restLng, restLat] = restaurant.autoLocation.coordinates;
    const [addrLng, addrLat] = selectedAddress.location.coordinates;
    const distance = getDistanceKm(restLat, restLng, addrLat, addrLng);
    setCreatingOrder(true);
    try {
      const { data } = await axios.post(
        `${restaurantService}/api/order/new`,
        {
          distance,
          restaurantId: restaurant._id,
          addressId: selectedAddressId,
          paymentMethod,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      return data;
    } catch (error) {
      console.log(error);
      toast.error("Failed to create order");
      return null;
    } finally {
      setCreatingOrder(false);
    }
  };

  const payWithRazorpay = async () => {
    if (!selectedAddressId) return;
    setLoadingRazorpay(true);
    try {
      const order = await createOrder("razorpay");
      if (!order) return;
      const orderId = String(order.orderId);
      const { data } = await axios.post(
        `${utilsService}/api/payment/create`,
        { orderId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      if (!data.success) {
        toast.error(data.error || data.message || "Failed to create payment");
        return;
      }
      const { razorpayOrderId, key, amount } = data;
      const options = {
        key,
        amount,
        currency: "INR",
        order_id: razorpayOrderId,
        name: "Tomato",
        description: "Payment for your order",
        handler: async function (response: any) {
          try {
            await axios.post(`${utilsService}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });
            toast.success("Payment successful");
            fetchMyCart();
            navigate("/paymentsuccess/" + response.razorpay_payment_id);
          } catch (error) {
            toast.error("Payment failed");
          }
        },
        theme: { color: TOMATO_COLOR },
      };
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.log(error);
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as
          | { error?: string; message?: string }
          | undefined;
        toast.error(
          errData?.error ||
            errData?.message ||
            "Payment failed please refresh the page",
        );
      } else {
        toast.error("Payment failed please refresh the page");
      }
    } finally {
      setLoadingRazorpay(false);
    }
  };

  const payWithStripe = async () => {
    try {
      setLoadingStripe(true);
      const order = await createOrder("stripe");
      if (!order) return;
      const { orderId } = order;
      const { data } = await axios.post(
        `${utilsService}/api/payment/stripe/create`,
        { orderId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || data.message || "Failed to create payment");
      }
    } catch (error) {
      toast.error("Payment failed");
    } finally {
      setLoadingStripe(false);
    }
  };

  const handlePay = () => {
    if (selectedPayment === "razorpay") payWithRazorpay();
    else payWithStripe();
  };

  const isBusy = creatingOrder || loadingRazorpay || loadingStripe;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
      <button
        onClick={() => navigate("/cart")}
        className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
      >
        ← Back to Cart
      </button>

      {/* Restaurant header */}
      <div className="rounded-xl bg-white shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Ordering from
        </p>
        <h2 className="text-lg font-semibold text-gray-900">
          {restaurant.name}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {restaurant.autoLocation.formattedAddress}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: address + payment */}
        <div className="lg:col-span-2 space-y-5">
          {/* Delivery address */}
          <div className="rounded-xl bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Delivery Address</h3>
              <button
                onClick={() => navigate("/address")}
                className="text-sm font-semibold"
                style={{ color: TOMATO_COLOR }}
              >
                + Add New
              </button>
            </div>

            {loadingAddresses ? (
              <p className="text-sm text-gray-400 py-2">Loading addresses…</p>
            ) : addresses.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500">No saved addresses</p>
                <button
                  onClick={() => navigate("/address")}
                  className="mt-2 text-sm font-semibold"
                  style={{ color: TOMATO_COLOR }}
                >
                  Add a delivery address
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      className="cursor-pointer flex items-start gap-3 p-3 rounded-lg border transition-all"
                      style={{
                        borderColor: isSelected ? TOMATO_COLOR : "#e5e7eb",
                        backgroundColor: isSelected ? "#fff5f5" : "white",
                      }}
                    >
                      {/* Custom radio */}
                      <div
                        className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                        style={{
                          borderColor: isSelected ? TOMATO_COLOR : "#d1d5db",
                          backgroundColor: isSelected ? TOMATO_COLOR : "white",
                        }}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 leading-snug">
                          {addr.formattedAddress}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {addr.mobile}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="rounded-xl bg-white shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
            <div className="space-y-2">
              {/* Razorpay */}
              <div
                onClick={() => setSelectedPayment("razorpay")}
                className="cursor-pointer flex items-center gap-3 p-3.5 rounded-lg border-2 transition-all"
                style={{
                  borderColor:
                    selectedPayment === "razorpay" ? TOMATO_COLOR : "#e5e7eb",
                  backgroundColor:
                    selectedPayment === "razorpay" ? "#fff5f5" : "white",
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{
                    borderColor:
                      selectedPayment === "razorpay" ? TOMATO_COLOR : "#d1d5db",
                    backgroundColor:
                      selectedPayment === "razorpay" ? TOMATO_COLOR : "white",
                  }}
                >
                  {selectedPayment === "razorpay" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <RazorpayLogo />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    Razorpay
                  </p>
                  <p className="text-xs text-gray-500">
                    UPI · Cards · Netbanking · Wallets
                  </p>
                </div>
                <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>

              {/* Stripe */}
              <div
                onClick={() => setSelectedPayment("stripe")}
                className="cursor-pointer flex items-center gap-3 p-3.5 rounded-lg border-2 transition-all"
                style={{
                  borderColor:
                    selectedPayment === "stripe" ? TOMATO_COLOR : "#e5e7eb",
                  backgroundColor:
                    selectedPayment === "stripe" ? "#fff5f5" : "white",
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{
                    borderColor:
                      selectedPayment === "stripe" ? TOMATO_COLOR : "#d1d5db",
                    backgroundColor:
                      selectedPayment === "stripe" ? TOMATO_COLOR : "white",
                  }}
                >
                  {selectedPayment === "stripe" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <StripeLogo />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Stripe</p>
                  <p className="text-xs text-gray-500">
                    International cards · Apple Pay · Google Pay
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: bill summary */}
        <div className="rounded-xl bg-white shadow-sm p-4 h-fit space-y-1">
          <h3 className="font-semibold text-gray-900 mb-3">Bill Details</h3>

          {/* Items */}
          <div className="space-y-2.5 mb-3">
            {cart.map((item: ICart) => {
              const itemData = getMenuItem(item);
              const itemId = getItemId(item);
              return (
                <div
                  key={itemId}
                  className="flex items-center justify-between text-sm text-gray-600 gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    {itemData?.image && (
                      <img
                        src={itemData.image}
                        alt={itemData.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100"
                      />
                    )}
                    <span className="truncate text-gray-700">
                      {itemData?.name || "Item"}{" "}
                      <span className="text-gray-400 text-xs">
                        × {item.quantity}
                      </span>
                    </span>
                  </div>
                  <span className="shrink-0 font-medium text-gray-800">
                    ₹{((itemData?.price ?? 0) * item.quantity).toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Item Total ({quantity} items)
              </span>
              <span>₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery Fee</span>
              <span>
                {deliveryFee === 0 ? (
                  <span
                    className="font-semibold"
                    style={{ color: TOMATO_COLOR }}
                  >
                    Free
                  </span>
                ) : (
                  `₹${deliveryFee.toFixed(2)}`
                )}
              </span>
            </div>
            {subTotal < FREE_DELIVERY_THRESHOLD && (
              <p className="text-xs" style={{ color: TOMATO_COLOR }}>
                Add ₹{amountForFreeDelivery.toFixed(0)} more for free delivery
              </p>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Fee</span>
              <span>₹{platformFee.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between font-semibold text-base border-t mt-2 pt-3">
            <span>Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={handlePay}
            disabled={isBusy || !selectedAddressId}
            className="mt-4 w-full text-white rounded-lg px-4 py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: TOMATO_COLOR }}
          >
            {isBusy ? "Processing…" : `Pay ₹${grandTotal.toFixed(2)}`}
          </button>

          {!selectedAddressId && addresses.length > 0 && (
            <p
              className="text-xs text-center mt-1"
              style={{ color: TOMATO_COLOR }}
            >
              Please select a delivery address
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
