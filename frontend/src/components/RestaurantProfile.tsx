import axios from "axios";
import type { IRestaurant } from "../types";
import { useState } from "react";
import { restaurantService } from "../App";
import toast from "react-hot-toast";
import { BiMapPin, BiEdit, BiSave, BiToggleRight } from "react-icons/bi";

interface props {
  restaurant: IRestaurant;
  isSeller: boolean;
  onUpdate: (restaurant: IRestaurant) => void;
}

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
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      setIsOpen(data.restaurant.isOpen);
      toast.success("Restaurant status updated successfully");
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
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success("Restaurant updated successfully");
      onUpdate(data.restaurant);
    } catch (error) {
      console.log(error);
      toast.error("Problem in updating restaurant");
    } finally {
      setEditMode(false);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-xl bg-white shadow-sm overflow-hidden">
      {restaurant.image && (
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            {isSeller && editMode ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-2 border-gray-400 px-4 py-2 text-sm outline-none focus:border-[#E23774] focus:ring-[#E23774] "
              />
            ) : (
              <h2 className="text-xl font-semibold">{restaurant.name}</h2>
            )}
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 ">
              <BiMapPin className="h-4 w-4 text-[#E23774]" />
              {restaurant.autoLocation.formattedAddress ||
                "No location selected"}
            </div>
          </div>
          {isSeller && (
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-sm text-gray-500 hover:text-[#E23774]"
            >
              <BiEdit size={18} color="#E23774" /> Edit
            </button>
          )}
        </div>
        {editMode ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-2 border-gray-400 px-4 py-2 text-sm outline-none focus:border-[#E23774] focus:ring-[#E23774] "
          />
        ) : (
          <p className="text-sm text-gray-600">
            {restaurant.description || "No description added"}
          </p>
        )}
        <div className={`flex items-center justify-between pt-3 border-t `}>
          <span
            className={`text-sm font-medium ${isOpen ? "text-green-700" : "text-red-700"}`}
          >
            {isOpen ? "OPEN" : "CLOSED"}
          </span>
          <div className="flex items-center gap-2">
            {editMode && (
              <button
                onClick={saveChanges}
                disabled={loading}
                className="text-sm text-gray-500 bg-[#E23774] text-white px-3 py-1 rounded"
              >
                Save
              </button>
            )}
            {isSeller && (
              <button
                onClick={toggleOpenStatus}
                disabled={loading}
                className={`px-3 py-1 rounded text-sm font-medium text-white ${isOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                {isOpen ? "Close Restaurant" : "Open Restaurant"}
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Created at: {new Date(restaurant.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default RestaurantProfile;
