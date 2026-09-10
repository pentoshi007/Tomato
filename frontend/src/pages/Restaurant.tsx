import axios from "axios";
import type { IRestaurant, SellerTabs } from "../types";
import { useState, useEffect } from "react";
import { restaurantService } from "../config";
import { useSocket } from "../context/useSocket";
import { toast } from "react-hot-toast";
import AddRestaurant from "./AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import AddMenuItem from "../components/AddMenuItem";
import type { IMenuItem } from "../types";
import RestaurantOrders from "../components/RestaurantOrders.tsx";
import { Logo } from "../components/ui/Logo";
import { PageLoader } from "../components/ui/primitives";

const TABS: { key: SellerTabs; label: string }[] = [
  { key: "menu", label: "Menu" },
  { key: "add-items", label: "Add dish" },
];

export const Restaurant = () => {
  const { reconnect } = useSocket();
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabs, setTabs] = useState<SellerTabs>("menu");
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);

  const fetchMyRestaurant = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/my`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      setRestaurant(data.restaurant);
      if (data.token) {
        localStorage.setItem("token", data.token);
        // New token now contains restaurantId — reconnect socket so the seller
        // joins the correct restaurant room for real-time order notifications.
        reconnect();
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setRestaurant(null);
      } else {
        console.log(error);
        toast.error("Problem in fetching restaurant");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRestaurant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMenuItems = async (restaurantId: string) => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/item/all/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      setMenuItems(data.items);
    } catch (error) {
      console.log(error);
      toast.error("Problem in fetching menu items");
    }
  };

  useEffect(() => {
    if (restaurant && restaurant._id) {
      fetchMenuItems(restaurant._id);
    }
  }, [restaurant]);

  if (loading) {
    return <PageLoader label="Opening your kitchen…" />;
  }
  if (!restaurant) {
    return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur-[2px]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo size={32} />
          <span className="chip bg-mustard">Seller kitchen</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <RestaurantProfile
          restaurant={restaurant}
          isSeller={true}
          onUpdate={setRestaurant}
        />

        <RestaurantOrders
          restaurantId={restaurant._id}
          soundEnabled={restaurant.soundEnabled}
          onSoundEnabledChange={(enabled) =>
            setRestaurant((current) =>
              current ? { ...current, soundEnabled: enabled } : current,
            )
          }
        />

        <div className="card overflow-hidden">
          <div className="flex border-b-2 border-ink">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTabs(t.key)}
                className={`flex-1 cursor-pointer px-4 py-3.5 text-sm font-black tracking-wide uppercase transition-colors ${
                  tabs === t.key
                    ? "bg-tomato text-white"
                    : "bg-paper text-smoke hover:bg-butter"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-5">
            {tabs === "menu" && (
              <MenuItems
                items={menuItems}
                onItemDeleted={() => fetchMenuItems(restaurant._id)}
                isSeller={true}
              />
            )}
            {tabs === "add-items" && (
              <AddMenuItem onItemAdded={() => fetchMenuItems(restaurant._id)} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
