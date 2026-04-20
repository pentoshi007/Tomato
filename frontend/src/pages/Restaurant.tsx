import axios from "axios";
import type { IRestaurant, SellerTabs } from "../types";
import { useState, useEffect } from "react";
import { restaurantService } from "../App";
import { toast } from "react-hot-toast";
import AddRestaurant from "./AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";

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
            { key: "add-item", label: "Add Item" },
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
            <p className="text-gray-500">No menu items found</p>
          )}
          {tabs === "add-items" && (
            <p className="text-gray-500">No items to add</p>
          )}
          {tabs === "sales" && <p className="text-gray-500">No sales found</p>}
        </div>
      </div>
    </div>
  );
};
