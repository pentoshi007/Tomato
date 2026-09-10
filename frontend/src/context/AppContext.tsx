import axios from "axios";
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  useRef,
} from "react";
import { AuthService, restaurantService, utilsService } from "../config";
import { useDemo } from "../demo/useDemo";
import type { AppContextType, ICart, Location } from "../types";
import type { User } from "../types";
import toast from "react-hot-toast";

const AppContext = createContext<AppContextType | undefined>(undefined);
interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const demo = useDemo();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [cart, setCart] = useState<ICart[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const locationRequestStartedRef = useRef(false);

  const readCachedUser = (): User | null => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as User | null;
      return parsed && typeof parsed === "object" && parsed._id ? parsed : null;
    } catch {
      return null;
    }
  };

  async function fetchUser() {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuth(false);
      setLoading(false);
      return;
    }
    const cachedUser = readCachedUser();
    if (cachedUser) {
      setUser(cachedUser);
      setIsAuth(true);
      setLoading(false);
    }
    try {
      const { data } = await axios.get(`${AuthService}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(data.user);
      setIsAuth(true);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuth(false);
      }
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  const requestLocation = () => {
    // Optional dev/QA override — bypasses the browser geolocation prompt.
    const mock = import.meta.env.VITE_MOCK_LOCATION as string | undefined;
    if (mock) {
      const [lat, lng] = mock.split(",").map(Number);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setLoadingLocation(true);
        axios
          .get(`${utilsService}/api/geocode/reverse`, {
            params: { lat, lon: lng },
            timeout: 3000,
          })
          .then(({ data }) => {
            setLocation({
              latitude: lat,
              longitude: lng,
              formattedAddress: data.display_name || "Unknown Location",
            });
            setCity(
              data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                "Unknown City",
            );
          })
          .catch(() => {
            setLocation({ latitude: lat, longitude: lng, formattedAddress: "" });
            setCity("Unknown City");
          })
          .finally(() => setLoadingLocation(false));
        return;
      }
    }

    if (!navigator.geolocation) {
      toast.error("Please enable location services to continue");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const { data } = await axios.get(
            `${utilsService}/api/geocode/reverse`,
            { params: { lat: latitude, lon: longitude }, timeout: 3000 },
          );
          setLocation({
            latitude,
            longitude,
            formattedAddress: data.display_name || "Unknown Location",
          });
          setCity(
            data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              "Unknown City",
          );
        } catch (error) {
          // Geocoding failed — still set coords so app remains functional
          setLocation({ latitude, longitude, formattedAddress: "" });
          setCity("Unknown City");
          console.warn("AppContext geocoding failed:", error);
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        // User denied permission — non-fatal
        setLoadingLocation(false);
      },
    );
  };

  useEffect(() => {
    // React Strict Mode runs mount effects twice in development. Avoid
    // requesting the same location and geocoding it twice.
    if (locationRequestStartedRef.current) return;
    locationRequestStartedRef.current = true;
    requestLocation();
  }, []);

  const activeUser = useMemo(
    () =>
      demo.active && demo.role && user
        ? { ...user, role: demo.role as string }
        : user,
    [demo.active, demo.role, user],
  );
  const activeLocation = demo.active ? demo.origin : location;
  const activeCity = demo.active ? demo.city : city;

  const fetchMyCart = async () => {
    if (!activeUser || activeUser.role !== "customer") {
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
  }, [activeUser]);

  return (
    <AppContext.Provider
      value={{
        user: activeUser,
        loading,
        isAuth,
        setUser,
        setIsAuth,
        setLoading,
        location: activeLocation,
        loadingLocation,
        city: activeCity,
        retryLocation: requestLocation,
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
