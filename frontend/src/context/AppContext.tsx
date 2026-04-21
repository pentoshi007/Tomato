import axios from "axios";
import { createContext, useState, useEffect, useContext } from "react";
import { AuthService, restaurantService } from "../App.tsx";
import type { AppContextType, ICart, Location } from "../types";
import type { User } from "../types";
import toast from "react-hot-toast";

const AppContext = createContext<AppContextType | undefined>(undefined);
interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [cart, setCart] = useState<ICart[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [quantity, setQuantity] = useState(0);

  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuth(false);
        return;
      }
      const { data } = await axios.get(`${AuthService}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(data.user);
      setIsAuth(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      return alert("Please enable location services to continue");
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        );
        const data = await res.json();
        setLocation({
          latitude,
          longitude,
          formattedAddress: data.display_name || "Unknown Location",
        });
        setCity(
          data.address.city ||
            data.address.town ||
            data.address.village ||
            "Unknown City",
        );
      } catch (error) {
        setLocation({
          latitude,
          longitude,
          formattedAddress: "Unknown Location",
        });
        setCity("Unknown City");
        toast.error("Problem in getting location. Please try again." + error);
      } finally {
        setLoadingLocation(false);
      }
    });
  }, []);

  const fetchMyCart = async () => {
    if (!user || user.role !== "customer") {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const { data } = await axios.get(`${restaurantService}/api/cart/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCart(data.cart ?? []);
      setSubTotal(data.totalPrice ?? 0);
      setQuantity(data.cartLength ?? 0);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchMyCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        isAuth,
        setUser,
        setIsAuth,
        setLoading,
        location,
        loadingLocation,
        city,
        cart,
        subTotal,
        quantity,
        fetchMyCart,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// React Fast Refresh expects this file to only export components.
// We expose this hook anyway because the app uses it in route guards.
// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
