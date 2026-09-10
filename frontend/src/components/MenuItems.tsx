import { BiTrash, BiPlus, BiMinus } from "react-icons/bi";
import type { IMenuItem } from "../types";
import { toast } from "react-hot-toast";
import axios, { AxiosError } from "axios";
import { restaurantService } from "../config";
import { useAppContext } from "../context/AppContext";
import { useState } from "react";
import { FoodImage } from "./ui/FoodImage";
import { EmptyState, Spinner } from "./ui/primitives";
import { SteamBowl } from "./ui/illustrations";

interface MenuItemsProps {
  items: IMenuItem[];
  onItemDeleted: () => void;
  isSeller: boolean;
  restaurantId?: string;
  onItemClick?: (item: IMenuItem) => void;
}

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const MenuItems = ({
  items,
  isSeller,
  onItemDeleted,
  onItemClick,
  restaurantId,
}: MenuItemsProps) => {
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const { fetchMyCart } = useAppContext();

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={<SteamBowl size={56} />}
        title={isSeller ? "Your menu is empty" : "No dishes yet"}
        body={
          isSeller
            ? "Add your first dish and start taking orders."
            : "This kitchen hasn't listed anything yet. Check back soon."
        }
      />
    );
  }

  const handleDelete = async (itemId: string) => {
    const confirm = window.confirm("Delete this item from the menu?");
    if (!confirm) return;
    try {
      await axios.delete(`${restaurantService}/api/item/${itemId}`, {
        headers: authHeaders(),
      });
      toast.success("Item deleted");
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
        { headers: authHeaders() },
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

  const addToCart = async (restaurantId: string | undefined, itemId: string) => {
    if (!restaurantId) {
      toast.error("Restaurant information is missing");
      return;
    }
    try {
      setLoadingItemId(itemId);
      await axios.post(
        `${restaurantService}/api/cart/add`,
        { restaurantId, itemId },
        { headers: authHeaders() },
      );
      toast.success("Added to cart");
      fetchMyCart();
    } catch (error: unknown) {
      console.error(error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(
        typeof message === "string" ? message : "Problem in adding to cart",
      );
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((item) => {
        const unavailable = !item.isAvailable;
        return (
          <article
            key={item._id}
            onClick={() => !isSeller && onItemClick?.(item)}
            className={`card-flat flex gap-4 p-4 transition-all ${
              unavailable ? "opacity-70" : ""
            } ${
              !isSeller
                ? "cursor-pointer hover:-translate-0.5 hover:shadow-pop-sm"
                : ""
            }`}
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-ink">
              <FoodImage
                src={item.image}
                alt={item.name}
                width={300}
                className={`h-full w-full object-cover ${
                  unavailable ? "grayscale" : ""
                }`}
              />
              {unavailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
                  <span className="rounded-full bg-paper px-2 py-0.5 text-[9px] font-black tracking-wide uppercase">
                    Sold out
                  </span>
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <h3 className="font-display truncate text-base font-bold">
                {item.name}
              </h3>
              <p className="mt-0.5 line-clamp-2 text-xs font-medium text-smoke">
                {item.description || "No description"}
              </p>
              <p className="mt-1 text-base font-extrabold text-tomato">
                ₹{item.price}
              </p>

              {isSeller && (
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => toggleAvailability(item._id)}
                    className={`chip cursor-pointer transition-transform hover:-translate-y-0.5 ${
                      item.isAvailable ? "bg-mint" : "bg-mist"
                    }`}
                    title="Toggle availability"
                  >
                    {item.isAvailable ? (
                      <>
                        <BiMinus className="h-3.5 w-3.5" /> Pause item
                      </>
                    ) : (
                      <>
                        <BiPlus className="h-3.5 w-3.5" /> Resume item
                      </>
                    )}
                  </button>
                  <button
                    className="btn-danger-ghost !rounded-lg !border-2 !border-transparent !p-1.5 hover:!border-tomato"
                    onClick={() => handleDelete(item._id)}
                    title="Delete item"
                    aria-label={`Delete ${item.name}`}
                  >
                    <BiTrash className="h-4.5 w-4.5" />
                  </button>
                </div>
              )}
            </div>

            {!isSeller && (
              <div className="flex shrink-0 items-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(restaurantId ?? item.restaurantId, item._id);
                  }}
                  disabled={unavailable || loadingItemId === item._id}
                  className="btn-primary !rounded-full !px-4 !py-1.5 !text-xs"
                  aria-label={`Add ${item.name} to cart`}
                >
                  {loadingItemId === item._id ? (
                    <Spinner size={14} className="text-white" />
                  ) : (
                    <BiPlus className="h-4 w-4" />
                  )}
                  Add
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default MenuItems;
