import { useEffect } from "react";
import type { IMenuItem } from "../types";
import { BiX, BiPlus } from "react-icons/bi";
import { FoodImage } from "./ui/FoodImage";
import { Spinner } from "./ui/primitives";

interface Props {
  item: IMenuItem;
  onClose: () => void;
  onAddToCart?: (item: IMenuItem) => void;
  addingToCart?: boolean;
}

const MenuItemModal = ({ item, onClose, onAddToCart, addingToCart }: Props) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <div
        className="animate-pop-in relative w-full max-w-lg overflow-hidden rounded-t-3xl border-2 border-b-0 border-ink bg-paper shadow-pop-xl sm:rounded-3xl sm:border-b-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="btn-secondary absolute top-3 right-3 z-10 !rounded-full !p-1.5"
          aria-label="Close"
        >
          <BiX size={20} />
        </button>

        <div className="relative h-60 border-b-2 border-ink">
          <FoodImage
            src={item.image}
            alt={item.name}
            width={900}
            eager
            className={`h-full w-full object-cover ${
              !item.isAvailable ? "grayscale" : ""
            }`}
          />
          {!item.isAvailable && (
            <span className="sticker absolute bottom-3 left-3 bg-ink text-cream">
              Sold out
            </span>
          )}
        </div>

        <div className="space-y-3 p-5">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            {item.name}
          </h2>
          <p className="text-sm leading-relaxed font-medium whitespace-pre-line text-smoke">
            {item.description || "No description"}
          </p>

          <div className="flex items-center justify-between border-t-2 border-mist pt-4">
            <span className="font-display text-2xl font-extrabold text-tomato">
              ₹{item.price}
            </span>
            <button
              onClick={() => onAddToCart?.(item)}
              disabled={!item.isAvailable || addingToCart}
              className="btn-primary"
            >
              {addingToCart ? (
                <Spinner size={18} className="text-white" />
              ) : (
                <BiPlus size={20} />
              )}
              {addingToCart ? "Adding…" : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemModal;
