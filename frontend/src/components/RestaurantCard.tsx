import { useNavigate } from "react-router-dom";
import { BiTimeFive } from "react-icons/bi";
import { FoodImage } from "./ui/FoodImage";

type props = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  distance: number | null;
  isOpen: boolean;
  eager?: boolean;
};

const RestaurantCard = ({
  id,
  name,
  description,
  image,
  distance,
  isOpen,
  eager = false,
}: props) => {
  const navigate = useNavigate();
  return (
    <article
      onClick={() => navigate(`/restaurant/${id}`)}
      className={`card card-hover group cursor-pointer overflow-hidden ${
        isOpen ? "" : "opacity-80"
      }`}
    >
      <div className="relative h-44 w-full overflow-hidden border-b-2 border-ink">
        <FoodImage
          src={image}
          alt={name}
          width={640}
          eager={eager}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            !isOpen ? "grayscale" : ""
          }`}
        />
        {!isOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/45">
            <span className="sticker bg-paper">Closed</span>
          </div>
        )}
        {distance !== null && (
          <span className="absolute right-3 bottom-3 chip bg-ink !border-ink text-cream">
            {distance < 1
              ? `${Math.round(distance * 1000)} m`
              : `${distance} km`}
          </span>
        )}
        <span
          className={`absolute top-3 left-3 chip ${
            isOpen ? "bg-mint text-ink" : "bg-paper text-ink"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full border border-ink ${
              isOpen ? "bg-basil" : "bg-tomato"
            }`}
          />
          {isOpen ? "Open now" : "Closed"}
        </span>
      </div>
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="font-display truncate text-lg font-bold">{name}</h3>
          {description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-smoke">
              {description}
            </p>
          )}
        </div>
        <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-butter px-2 py-0.5 text-[11px] font-black">
          <BiTimeFive className="h-3.5 w-3.5" />
          {distance !== null
            ? `${Math.max(10, Math.round(15 + distance * 4))} min`
            : "30 min"}
        </span>
      </div>
    </article>
  );
};

export default RestaurantCard;
