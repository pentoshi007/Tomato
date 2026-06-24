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

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready_for_rider"
  | "rider_assigned"
  | "picked_up"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "razorpay" | "stripe";
export type PaymentStatus = "pending" | "paid" | "failed";

export interface IOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface IOrder {
  _id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  riderId: string | null;
  riderPhone: number | null;
  riderName: string | null;
  distance: number;
  riderAmount: number;
  items: IOrderItem[];
  subTotal: number;
  deliveryFee: number;
  platformFee: number;
  totalAmount: number;
  addressId: string;
  deliveryAddress: {
    formattedAddress: string;
    mobile: number;
    latitude: number;
    longitude: number;
  };
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId: string | null;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export type SellerTabs = "menu" | "add-items" | "sales";

export interface ICart {
  userId: string;
  restaurantId: string | IRestaurant;
  itemId: string | IMenuItem;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
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

  cart: ICart[];
  subTotal: number;
  quantity: number;
  fetchMyCart: () => Promise<void>;
}
export interface IAddress {
  _id: string;
  userId: string;
  formattedAddress: string;
  mobile: number;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
}
