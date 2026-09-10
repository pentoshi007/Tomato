import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useSearchParams } from "react-router-dom";
import type { IRestaurant } from "../types";
import { toast } from "react-hot-toast";
import axios from "axios";
import { restaurantService } from "../config";
import RestaurantCard from "../components/RestaurantCard";
import { getDistanceKm } from "../utils/getDistanceKm";
import { Skeleton, EmptyState } from "../components/ui/primitives";
import { TomatoMark } from "../components/ui/Logo";
import {
  Burger,
  PizzaSlice,
  Fries,
  DrinkCup,
  Donut,
  Taco,
  SteamBowl,
  Sparkle,
  Squiggle,
} from "../components/ui/illustrations";
import { BiMapPin, BiX } from "react-icons/bi";

const CATEGORIES = [
  { label: "Pizza", q: "pizza", Icon: PizzaSlice, bg: "bg-blush" },
  { label: "Burgers", q: "burger", Icon: Burger, bg: "bg-butter" },
  { label: "Biryani", q: "biryani", Icon: SteamBowl, bg: "bg-skywash" },
  { label: "Tacos", q: "taco", Icon: Taco, bg: "bg-mint" },
  { label: "Desserts", q: "dessert", Icon: Donut, bg: "bg-blush" },
  { label: "Shakes", q: "shake", Icon: DrinkCup, bg: "bg-butter" },
  { label: "Fries", q: "fries", Icon: Fries, bg: "bg-mint" },
];

const MARQUEE_ITEMS = [
  "Hot & fresh",
  "Under 30 min",
  "Local kitchens",
  "Live order tracking",
  "Zero fuss",
];

const HeroArt = () => (
  <div
    className="relative mx-auto hidden w-full max-w-sm select-none sm:block"
    aria-hidden="true"
  >
    <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-mustard shadow-pop" />
    <div className="animate-floaty relative z-10 flex justify-center">
      <Burger size={190} />
    </div>
    <div
      className="animate-floaty absolute -top-2 -left-2 z-20"
      style={{ animationDelay: "0.8s", ["--float-rot" as string]: "-8deg" }}
    >
      <PizzaSlice size={84} />
    </div>
    <div
      className="animate-floaty absolute top-10 -right-3 z-20"
      style={{ animationDelay: "1.6s", ["--float-rot" as string]: "10deg" }}
    >
      <Fries size={76} />
    </div>
    <div
      className="animate-floaty absolute -bottom-4 left-6 z-20"
      style={{ animationDelay: "2.4s", ["--float-rot" as string]: "6deg" }}
    >
      <Donut size={72} />
    </div>
    <Sparkle
      size={30}
      className="animate-floaty absolute top-0 right-16 z-20"
      style={{ animationDelay: "1.1s" }}
    />
    <span className="sticker absolute -bottom-2 right-4 z-30 bg-basil text-white">
      30 min
    </span>
  </div>
);

const Marquee = () => (
  <div className="overflow-hidden border-y-2 border-ink bg-tomato py-2.5">
    <div className="marquee-track items-center gap-8 pr-8">
      {[0, 1].map((copy) => (
        <div key={copy} className="flex items-center gap-8" aria-hidden={copy === 1}>
          {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((item, i) => (
            <span
              key={`${copy}-${i}`}
              className="flex items-center gap-8 text-sm font-black tracking-widest whitespace-nowrap text-cream uppercase"
            >
              {item}
              <Sparkle size={16} />
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const Home = () => {
  const { location, loadingLocation, city, retryLocation } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { latitude, longitude } = location;
        const response = await axios.get(
          `${restaurantService}/api/restaurant/nearby`,
          {
            params: { latitude, longitude, search },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        if (!cancelled) setRestaurants(response.data.restaurants ?? []);
      } catch (error) {
        console.log(error);
        if (!cancelled) toast.error("Problem in fetching restaurants");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location, search]);

  const showHero = !search;

  return (
    <div className="pb-10">
      {showHero && (
        <>
          <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-10 pb-12 sm:pt-14 md:grid-cols-2">
            <div className="animate-rise-in">
              <span className="sticker bg-mustard text-ink">
                <Sparkle size={14} /> Fresh off the pass
              </span>
              <h1 className="font-display mt-5 text-5xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl">
                Crave it.
                <br />
                Tap it.
                <br />
                <span className="relative inline-block text-tomato">
                  Get it.
                  <Squiggle className="absolute -bottom-2 left-0 h-3 w-full" />
                </span>
              </h1>
              <p className="mt-5 max-w-md text-base font-medium text-smoke sm:text-lg">
                The best kitchens in{" "}
                <span className="font-bold text-ink">
                  {city ?? "your city"}
                </span>{" "}
                are cooking right now. Your door is the finish line.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="#near-you" className="btn-primary !px-6 !py-3 !text-base">
                  Find food near me
                </a>
                <span className="chip bg-paper !py-2">
                  <BiMapPin className="h-4 w-4 text-tomato" />
                  {city ?? "Locating…"}
                </span>
              </div>
            </div>
            <HeroArt />
          </section>
          <Marquee />
        </>
      )}

      <main id="near-you" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-10">
        {showHero && (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {CATEGORIES.map(({ label, q, Icon, bg }) => (
              <button
                key={q}
                onClick={() => setSearchParams({ search: q })}
                className={`${bg} flex shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-ink px-5 py-3 shadow-pop-xs transition-all hover:-translate-0.5 hover:shadow-pop-sm active:translate-0.5 active:shadow-none`}
              >
                <Icon size={38} />
                <span className="text-xs font-black">{label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {search ? `Results for “${search}”` : "Near you"}
            </h2>
            {!loading && location && (
              <p className="mt-1 text-sm font-medium text-smoke">
                {restaurants.length}{" "}
                {restaurants.length === 1 ? "spot" : "spots"} ready to cook
                for you
              </p>
            )}
          </div>
          {search && (
            <button
              onClick={() => setSearchParams({})}
              className="btn-secondary !py-1.5 !text-xs"
            >
              <BiX className="h-4 w-4" /> Clear search
            </button>
          )}
        </div>

        {!location ? (
          loadingLocation ? (
            <RestaurantGridSkeleton />
          ) : (
            <EmptyState
              icon={<BiMapPin className="h-10 w-10 text-tomato" />}
              title="We need your location"
              body="Turn on location access so we can find kitchens cooking near you."
              action={
                <button onClick={retryLocation} className="btn-primary">
                  Enable location
                </button>
              }
            />
          )
        ) : loading ? (
          <RestaurantGridSkeleton />
        ) : restaurants.length === 0 ? (
          <EmptyState
            icon={<TomatoMark size={52} />}
            title={
              search ? `Nothing found for “${search}”` : "No kitchens nearby yet"
            }
            body={
              search
                ? "Try a different craving — pizza, burgers, biryani…"
                : "Tomato is still expanding. Check back soon!"
            }
            action={
              search ? (
                <button
                  onClick={() => setSearchParams({})}
                  className="btn-secondary"
                >
                  Browse everything
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant, i) => {
              const [lng, lat] = restaurant.autoLocation.coordinates;
              const distanceKm = location
                ? getDistanceKm(
                    location.latitude,
                    location.longitude,
                    lat,
                    lng,
                  )
                : null;
              return (
                <RestaurantCard
                  key={restaurant._id}
                  id={restaurant._id}
                  name={restaurant.name}
                  description={restaurant.description}
                  image={restaurant.image}
                  distance={distanceKm}
                  isOpen={restaurant.isOpen}
                  eager={i < 3}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

const RestaurantGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="card overflow-hidden">
        <Skeleton className="h-44 w-full !rounded-none" />
        <div className="space-y-2 p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    ))}
  </div>
);

export default Home;
