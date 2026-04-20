export interface User {
  _id: string;
  email: string;
  name: string;
  image: string;
  role: string;
}
export interface Location {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}
export interface AppContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;

  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;

  location: Location | null;
  loadingLocation: boolean;
  city: string | null;
}
export interface IRestaurant {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  ownerId: string;
  phone: number;
  isVerified: boolean;
  autoLocation: {
    type: "Point";
    // "Point" is a GeoJSON object type used in MongoDB for geospatial queries.
    // It indicates that the "autoLocation" field stores a geographic coordinate as a single point (longitude, latitude).
    coordinates: [number, number];
    formattedAddress: string;
  };
  isOpen: boolean;
  createdAt: Date;
}

export interface IMenuItem {
  _id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type SellerTabs = "menu" | "add-items" | "sales";
