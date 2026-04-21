import { useNavigate } from "react-router-dom";

type props = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  distance: number | null;
  isOpen: boolean;
};

const RestaurantCard = ({
  id,
  name,
  description,
  image,
  distance,
  isOpen,
}: props) => {
  const navigate = useNavigate();
  return (
    <div
      className={`cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md ${
        isOpen ? "border border-green-500" : "border border-red-500 opacity-60"
      }`}
      onClick={() => navigate(`/restaurant/${id}`)}
    >
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={image || "/placeholder-restaurant.png"}
          alt={name}
          className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
            !isOpen ? "grayscale brightness-75" : ""
          }`}
        />
        {!isOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full px-3 py-1 bg-red-500 font-semibold text-sm text-white">
              CLOSED
            </span>
          </div>
        )}
        {distance !== null && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">
            {distance} km away
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-lg truncate">{name}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {isOpen ? "Open" : "Closed"}
          </span>
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default RestaurantCard;
