import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useSearchParams } from "react-router-dom";
import type { IRestaurant } from "../types";
import { toast } from "react-hot-toast";
import axios from "axios";
import { restaurantService } from "../App";
import RestaurantCard from "../components/RestaurantCard";

const getDistanceKm = (
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) => {
  const R = 6371;
  const dLat = ((latitude2 - latitude1) * Math.PI) / 180;
  const dLon = ((longitude2 - longitude1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((latitude1 * Math.PI) / 180) *
      Math.cos((latitude2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
};

const Home = () => {
  const { location } = useAppContext();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = async () => {
    if (!location) return;
    try {
      setLoading(true);
      const { latitude, longitude } = location;
      const response = await axios.get(
        `${restaurantService}/api/restaurant/nearby`,
        {
          params: {
            latitude,
            longitude,
            search,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      setRestaurants(response.data.restaurants ?? []);
    } catch (error) {
      console.log(error);
      toast.error("Problem in fetching restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [location, search]);

  if (loading || !location)
    return <div className="p-4">Finding restaurants near you ...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {restaurants.length === 0 && <p>No restaurants found.</p>}
      {restaurants.map((restaurant) => {
        const [lng, lat] = restaurant.autoLocation.coordinates;
        const distanceKm = location
          ? getDistanceKm(location.latitude, location.longitude, lat, lng)
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
          />
        );
      })}
    </div>
  );
};

export default Home;
