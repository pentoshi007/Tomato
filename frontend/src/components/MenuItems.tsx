import { BiEdit, BiToggleLeft, BiToggleRight } from "react-icons/bi";
import type { IMenuItem } from "../types";
import { toast } from "react-hot-toast";
import axios from "axios";
import { restaurantService } from "../App";

interface MenuItemsProps {
  items: IMenuItem[];
  onItemDeleted: () => void;
  isSeller: boolean;
}

const MenuItems = ({ items, isSeller, onItemDeleted }: MenuItemsProps) => {
  if (!items || items.length === 0) {
    return <p className="text-gray-500 py-6 text-center">No menu items yet.</p>;
  }
  const handleDelete = async (itemId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this item?",
    );
    if (!confirm) return;
    try {
      await axios.delete(`${restaurantService}/api/item/${itemId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Menu item deleted successfully");
      onItemDeleted();
    } catch (error) {
      console.log(error);
      toast.error("Problem in deleting menu item");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item._id}
          className={`flex gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100 ${
            !item.isAvailable ? "opacity-70" : ""
          }`}
        >
          <div className="relative shrink-0 w-20 h-20">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className={`w-20 h-20 object-cover rounded-lg ${
                  !item.isAvailable ? "grayscale brightness-75" : ""
                }`}
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                No Image
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1 text-left min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {item.name}
              </h3>
              {isSeller && (
                <button
                  title="Edit"
                  className="text-gray-500 hover:text-[#E23774] shrink-0"
                >
                  <BiEdit size={18} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">
              {item.description}
            </p>
            <p className="text-[#E23774] font-semibold mt-1">₹{item.price}</p>

            {isSeller && (
              <div className="mt-3 flex items-center justify-between border-t pt-2">
                <button
                  title="Toggle availability"
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-[#E23774]"
                >
                  {item.isAvailable ? (
                    <BiToggleRight size={22} className="text-green-600" />
                  ) : (
                    <BiToggleLeft size={22} className="text-gray-400" />
                  )}
                  <span>{item.isAvailable ? "Available" : "Unavailable"}</span>
                </button>
                <button
                  className="text-xs font-medium text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(item._id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          {!isSeller && (
            <button
              onClick={() => {}}
              disabled={!item.isAvailable}
              className={`flex items-center justify-center rounded-lg p-2 ${
                !item.isAvailable
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-red-500 hover:text-red-700"
              }`}
            >
              Add
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MenuItems;
