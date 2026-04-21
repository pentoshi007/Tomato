import { BiEdit, BiToggleLeft, BiToggleRight, BiCartAdd } from "react-icons/bi";
import type { IMenuItem } from "../types";
import { toast } from "react-hot-toast";
import axios, { AxiosError } from "axios";
import { restaurantService } from "../App";

interface MenuItemsProps {
  items: IMenuItem[];
  onItemDeleted: () => void;
  isSeller: boolean;
  onItemClick?: (item: IMenuItem) => void;
}

const MenuItems = ({
  items,
  isSeller,
  onItemDeleted,
  onItemClick,
}: MenuItemsProps) => {
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
  const toggleAvailability = async (itemId: string) => {
    try {
      const { data } = await axios.put(
        `${restaurantService}/api/item/status/${itemId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success(data.message);
      onItemDeleted();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message);
      } else {
        toast.error("An unknown error occurred");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item._id}
          onClick={() => !isSeller && onItemClick?.(item)}
          className={`flex gap-4 rounded-xl p-4 shadow-sm border ${
            !item.isAvailable
              ? "bg-gray-50 border-gray-200 opacity-80"
              : "bg-white border-gray-100"
          } ${!isSeller ? "cursor-pointer hover:shadow-md transition" : ""}`}
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
            {!item.isAvailable && (
              <div className="absolute inset-0 rounded-lg bg-black/35 flex items-center justify-center">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white px-2 py-1 rounded bg-black/50">
                  Not Available
                </span>
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
              {item.description || "No description"}
            </p>
            <p className="text-[#E23774] font-semibold mt-1">₹{item.price}</p>

            {isSeller && (
              <div className="mt-3 flex items-center justify-between border-t pt-2">
                <button
                  onClick={() => toggleAvailability(item._id)}
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
            <div className="flex items-center shrink-0">
              <button
                onClick={(e) => e.stopPropagation()}
                disabled={!item.isAvailable}
                title="Add to cart"
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  !item.isAvailable
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-[#E23774] text-white hover:bg-[#c92e64]"
                }`}
              >
                <BiCartAdd size={18} />
                <span>Add</span>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MenuItems;
