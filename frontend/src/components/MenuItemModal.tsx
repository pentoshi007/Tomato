import type { IMenuItem } from "../types";
import { BiCartAdd, BiX } from "react-icons/bi";

interface Props {
  item: IMenuItem;
  onClose: () => void;
  onAddToCart?: (item: IMenuItem) => void;
}

const MenuItemModal = ({ item, onClose, onAddToCart }: Props) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-1 text-gray-700 hover:bg-white"
          aria-label="Close"
        >
          <BiX size={22} />
        </button>

        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className={`h-64 w-full object-contain bg-gray-50 ${
              !item.isAvailable ? "grayscale brightness-75" : ""
            }`}
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center bg-gray-100 text-gray-400">
            No Image
          </div>
        )}

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                item.isAvailable
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {item.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>

          <p className="text-sm text-gray-600 whitespace-pre-line">
            {item.description || "No description"}
          </p>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-2xl font-bold text-[#E23774]">
              ₹{item.price}
            </span>
            <button
              onClick={() => onAddToCart?.(item)}
              disabled={!item.isAvailable}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                !item.isAvailable
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "bg-[#E23774] text-white hover:bg-[#c92e64]"
              }`}
            >
              <BiCartAdd size={20} />
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemModal;
