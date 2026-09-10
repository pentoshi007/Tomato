import axios from "axios";
import type { IRestaurant } from "../types";
import { useState } from "react";
import { restaurantService } from "../config";
import toast from "react-hot-toast";
import { BiMapPin, BiEdit, BiCheck, BiX } from "react-icons/bi";
import { FoodImage } from "./ui/FoodImage";

interface props {
  restaurant: IRestaurant;
  isSeller: boolean;
  onUpdate: (restaurant: IRestaurant) => void;
}

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const RestaurantProfile = ({ restaurant, isSeller, onUpdate }: props) => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description || "");
  const [isOpen, setIsOpen] = useState(restaurant.isOpen);
  const [loading, setLoading] = useState(false);

  const toggleOpenStatus = async () => {
    try {
      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/status`,
        { status: !isOpen },
        { headers: authHeaders() },
      );
      setIsOpen(data.restaurant.isOpen);
      toast.success(
        data.restaurant.isOpen ? "You're open for orders" : "Marked as closed",
      );
    } catch (error) {
      console.log(error);
      toast.error("Problem in updating restaurant status");
    }
  };

  const saveChanges = async () => {
    try {
      setLoading(true);
      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/edit`,
        { name, description },
        { headers: authHeaders() },
      );
      toast.success("Restaurant updated");
      onUpdate(data.restaurant);
      setEditMode(false);
    } catch (error) {
      console.log(error);
      toast.error("Problem in updating restaurant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="relative h-44 border-b-2 border-ink sm:h-56">
        <FoodImage
          src={restaurant.image}
          alt={restaurant.name}
          width={1200}
          eager
          className="h-full w-full object-cover"
        />
        <span
          className={`sticker absolute top-4 left-4 ${
            isOpen ? "bg-basil text-white" : "bg-ink text-cream"
          }`}
        >
          {isOpen ? "Open" : "Closed"}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isSeller && editMode ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input !text-lg !font-bold"
                aria-label="Restaurant name"
              />
            ) : (
              <h2 className="font-display truncate text-2xl font-extrabold tracking-tight">
                {restaurant.name}
              </h2>
            )}
            <p className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-smoke">
              <BiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-tomato" />
              <span className="line-clamp-2">
                {restaurant.autoLocation.formattedAddress ||
                  "No location selected"}
              </span>
            </p>
          </div>
          {isSeller && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="btn-secondary !px-3 !py-1.5 !text-xs"
            >
              <BiEdit className="h-4 w-4" /> Edit
            </button>
          )}
        </div>

        {editMode ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-20 resize-y"
            aria-label="Description"
          />
        ) : (
          <p className="text-sm leading-relaxed font-medium text-smoke">
            {restaurant.description || "No description added"}
          </p>
        )}

        {isSeller && (
          <div className="flex flex-wrap items-center gap-2 border-t-2 border-mist pt-4">
            {editMode ? (
              <>
                <button
                  onClick={saveChanges}
                  disabled={loading}
                  className="btn-primary !py-2 !text-xs"
                >
                  <BiCheck className="h-4 w-4" />
                  {loading ? "Saving…" : "Save changes"}
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setName(restaurant.name);
                    setDescription(restaurant.description || "");
                  }}
                  className="btn-ghost !py-2 !text-xs"
                >
                  <BiX className="h-4 w-4" /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={toggleOpenStatus}
                disabled={loading}
                className={`${isOpen ? "btn-danger-ghost" : "btn-primary"} !py-2 !text-xs`}
              >
                {isOpen ? "Close restaurant" : "Open restaurant"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantProfile;
