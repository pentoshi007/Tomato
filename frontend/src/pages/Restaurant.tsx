import axios from "axios";
import type { IRestaurant, SellerTabs } from "../types";
import { useState, useEffect } from "react";
import { restaurantService } from "../App";
import { toast } from "react-hot-toast";
import AddRestaurant from "./AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import AddMenuItem from "../components/AddMenuItem";
import type { IMenuItem } from "../types";

export const Restaurant = () => {
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [tabs, setTabs] = useState<SellerTabs>("menu");
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
      setLoading(false);
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
    } catch (error) {
      console.log(error);
      toast.error("Problem in fetching restaurant");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMyRestaurant();
  }, []);

  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurant && restaurant._id) {
      fetchMenuItems(restaurant._id);
    }
  }, [restaurant]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Loading your restaurant...</p>
      </div>
    );
  }
  if (!restaurant) {
    return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;
  }
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-6">
      <RestaurantProfile
        restaurant={restaurant}
        isSeller={true}
        onUpdate={setRestaurant}
      />
      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex border-b justify-around">
          {[
            { key: "menu", label: "Menu Items" },
            { key: "add-items", label: "Add Item" },
            { key: "sales", label: "Sales" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTabs(t.key as SellerTabs)}
              className={`px-4 py-2 text-sm font-medium ${
                tabs === t.key
                  ? "border-b-2 border-[#E23774]  text-[#E23774]"
                  : "text-gray-500 hover:text-[#E23774]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5 text-center">
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

          {tabs === "sales" && <p className="text-gray-500">No sales found</p>}
        </div>
      </div>
    </div>
  );
};
