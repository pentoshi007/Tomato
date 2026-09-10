import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { IAddress, IRestaurant, ICart, IMenuItem } from "../types";
import { restaurantService, utilsService } from "../config";
import toast from "react-hot-toast";
import { getDistanceKm } from "../utils/getDistanceKm";
import {
  getDeliveryFee,
  getGrandTotal,
  PLATFORM_FEE,
  MAX_DELIVERY_DISTANCE_KM,
} from "../utils/pricing";
import { BiArrowBack, BiMapPin, BiPlus, BiCheck } from "react-icons/bi";
import { FoodImage } from "../components/ui/FoodImage";
import { Skeleton, EmptyState } from "../components/ui/primitives";
import { Fries } from "../components/ui/illustrations";
import { useDemo } from "../demo/useDemo";

const TOMATO_COLOR = "#E23744";

const getMenuItem = (item: ICart): IMenuItem | null =>
  typeof item.itemId === "object" ? item.itemId : null;

const getItemId = (item: ICart): string =>
  typeof item.itemId === "string" ? item.itemId : item.itemId._id;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const RazorpayLogo = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="#2D81F7" />
    <path
      d="M7 17L10.5 7H13L15 13.5L17 7H19.5L16.5 17H14L12 10.5L10 17H7Z"
      fill="white"
    />
  </svg>
);

const StripeLogo = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="#635BFF" />
    <path
      d="M11.5 9.5C11.5 8.95 11.95 8.6 12.6 8.6C13.55 8.6 14.5 9.05 15.2 9.7L16.5 7.8C15.5 7 14.1 6.5 12.6 6.5C10.35 6.5 8.8 7.75 8.8 9.65C8.8 13.15 13.7 12.5 13.7 14.15C13.7 14.8 13.15 15.2 12.35 15.2C11.2 15.2 10.1 14.65 9.3 13.8L8 15.7C9 16.7 10.6 17.5 12.35 17.5C14.7 17.5 16.35 16.25 16.35 14.1C16.35 10.45 11.5 11.2 11.5 9.5Z"
      fill="white"
    />
  </svg>
);

const SelectRow = ({
  selected,
  onClick,
  children,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    aria-label={label}
    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
      selected
        ? "-translate-0.5 border-ink bg-blush shadow-pop-sm"
        : "border-mist bg-white hover:border-ink"
    }`}
  >
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-ink transition-colors ${
        selected ? "bg-tomato" : "bg-white"
      }`}
    >
      {selected && <BiCheck className="h-3.5 w-3.5 text-white" />}
    </span>
    {children}
  </button>
);

export default function CheckoutPage() {
  const navigate = useNavigate();

  const { cart, subTotal, quantity, fetchMyCart } = useAppContext();
  const { active: demoActive } = useDemo();
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
          { headers: authHeaders() },
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
      <div className="mx-auto max-w-md px-4 py-16">
        <EmptyState
          icon={<Fries size={72} />}
          title="Nothing to check out"
          body="Your tray is empty — go find something tasty first."
          action={
            <button onClick={() => navigate("/")} className="btn-primary">
              Browse food
            </button>
          }
        />
      </div>
    );
  }

  const restaurant = cart[0]?.restaurantId as IRestaurant;
  const deliveryFee = getDeliveryFee(subTotal);
  const platformFee = PLATFORM_FEE;
  const grandTotal = getGrandTotal(subTotal);

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
    if (distance > MAX_DELIVERY_DISTANCE_KM) {
      toast.error(
        `This address is ${distance.toFixed(1)} km away. Delivery is available within ${MAX_DELIVERY_DISTANCE_KM} km of the restaurant.`,
      );
      return null;
    }
    setCreatingOrder(true);
    try {
      const { data } = await axios.post(
        `${restaurantService}/api/order/new`,
        {
          restaurantId: restaurant._id,
          addressId: selectedAddressId,
          paymentMethod,
        },
        { headers: authHeaders() },
      );
      return data;
    } catch (error: unknown) {
      console.log(error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(
        typeof message === "string" ? message : "Failed to create order",
      );
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
        { headers: authHeaders() },
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
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
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
          } catch {
            toast.error("Payment failed");
          }
        },
        theme: { color: TOMATO_COLOR },
      };
      const razorpay = new (
        window as unknown as { Razorpay: new (opts: unknown) => { open(): void } }
      ).Razorpay(options);
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
        { headers: authHeaders() },
      );
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || data.message || "Failed to create payment");
      }
    } catch {
      toast.error("Payment failed");
    } finally {
      setLoadingStripe(false);
    }
  };

  const payInDemo = async () => {
    const order = await createOrder(selectedPayment);
    if (!order) return;
    await fetchMyCart();
    toast.success("Demo payment approved — tracking your order");
    navigate(`/order/${order.orderId}`);
  };

  const handlePay = () => {
    if (demoActive) {
      void payInDemo();
      return;
    }
    if (selectedPayment === "razorpay") payWithRazorpay();
    else payWithStripe();
  };

  const isBusy = creatingOrder || loadingRazorpay || loadingStripe;

  const payButton = (
    <button
      onClick={handlePay}
      disabled={isBusy || !selectedAddressId}
      className="btn-primary w-full !py-3.5 !text-base"
    >
      {isBusy ? "Processing…" : `Pay ₹${grandTotal.toFixed(2)}`}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-32 md:pb-10">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/cart")}
          className="btn-secondary !rounded-full !p-2"
          aria-label="Back to cart"
        >
          <BiArrowBack className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Checkout
          </h1>
          <p className="text-sm font-medium text-smoke">
            from{" "}
            <span className="font-bold text-ink">{restaurant.name}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Delivery address */}
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                Deliver to
              </h2>
              <button
                onClick={() => navigate("/address")}
                className="btn-secondary !py-1.5 !text-xs"
              >
                <BiPlus className="h-4 w-4" /> New address
              </button>
            </div>

            {loadingAddresses ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-ink/30 p-6 text-center">
                <BiMapPin className="mx-auto h-8 w-8 text-tomato" />
                <p className="mt-2 text-sm font-bold">No saved addresses</p>
                <p className="mt-1 text-xs font-medium text-smoke">
                  Add a delivery address to continue.
                </p>
                <button
                  onClick={() => navigate("/address")}
                  className="btn-primary mt-4 !py-2 !text-xs"
                >
                  Add address
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {addresses.map((addr) => (
                  <SelectRow
                    key={addr._id}
                    selected={selectedAddressId === addr._id}
                    onClick={() => setSelectedAddressId(addr._id)}
                    label={`Deliver to ${addr.formattedAddress}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm leading-snug font-bold">
                        {addr.formattedAddress}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-smoke">
                        {addr.mobile}
                      </p>
                    </div>
                  </SelectRow>
                ))}
              </div>
            )}
          </section>

          {/* Payment method */}
          <section className="card p-5">
            <h2 className="font-display mb-4 text-lg font-bold">Pay with</h2>
            <div className="space-y-2.5">
              <SelectRow
                selected={selectedPayment === "razorpay"}
                onClick={() => setSelectedPayment("razorpay")}
                label="Pay with Razorpay"
              >
                <RazorpayLogo />
                <div className="min-w-0">
                  <p className="text-sm font-bold">Razorpay</p>
                  <p className="text-xs font-medium text-smoke">
                    UPI · Cards · Netbanking · Wallets
                  </p>
                </div>
                <span className="chip ml-auto bg-mint !text-[10px]">
                  Recommended
                </span>
              </SelectRow>

              <SelectRow
                selected={selectedPayment === "stripe"}
                onClick={() => setSelectedPayment("stripe")}
                label="Pay with Stripe"
              >
                <StripeLogo />
                <div className="min-w-0">
                  <p className="text-sm font-bold">Stripe</p>
                  <p className="text-xs font-medium text-smoke">
                    International cards · Apple Pay · Google Pay
                  </p>
                </div>
              </SelectRow>
            </div>
          </section>
        </div>

        {/* Bill summary */}
        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold">Your order</h2>

          <div className="mt-4 space-y-3">
            {cart.map((item: ICart) => {
              const itemData = getMenuItem(item);
              const itemId = getItemId(item);
              return (
                <div
                  key={itemId}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border-2 border-ink">
                      <FoodImage
                        src={itemData?.image}
                        alt={itemData?.name ?? "Item"}
                        width={100}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="truncate font-bold">
                      {itemData?.name || "Item"}{" "}
                      <span className="text-xs font-medium text-smoke">
                        × {item.quantity}
                      </span>
                    </span>
                  </div>
                  <span className="shrink-0 font-extrabold">
                    ₹{((itemData?.price ?? 0) * item.quantity).toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 space-y-2 border-t-2 border-mist pt-3 text-sm font-medium">
            <div className="flex justify-between">
              <span className="text-smoke">Item total ({quantity} items)</span>
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

          <div className="mt-3 flex justify-between border-t-2 border-ink pt-3">
            <span className="font-display text-lg font-bold">Total</span>
            <span className="font-display text-lg font-extrabold text-tomato">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>

          <div className="mt-4 hidden lg:block">{payButton}</div>

          {!selectedAddressId && addresses.length > 0 && (
            <p className="mt-2 text-center text-xs font-bold text-tomato">
              Select a delivery address to pay
            </p>
          )}
        </aside>
      </div>

      {/* Sticky pay bar — mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        {payButton}
      </div>
    </div>
  );
}
