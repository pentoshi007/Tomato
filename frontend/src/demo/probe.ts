import axios from "axios";
import { restaurantService, riderService } from "../config";
import type { Location } from "../types";
import type { InviteReason } from "./types";

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const probeCustomer = async (location: Location | null) => {
  if (!location) return true;
  const { data } = await axios.get(
    `${restaurantService}/api/restaurant/nearby`,
    {
      params: { latitude: location.latitude, longitude: location.longitude },
      ...authConfig(),
    },
  );
  return (data.restaurants ?? []).length === 0;
};

const probeSeller = async () => {
  const { data } = await axios.get(
    `${restaurantService}/api/restaurant/my`,
    authConfig(),
  );
  if (!data.restaurant?._id) return true;
  const orders = await axios.get(
    `${restaurantService}/api/order/restaurant/${data.restaurant._id}`,
    authConfig(),
  );
  return (orders.data.orders ?? []).length === 0;
};

const probeRider = async () => {
  const { data } = await axios.get(
    `${riderService}/api/rider/myprofile`,
    authConfig(),
  );
  if (!data?._id) return true;
  const current = await axios.get(
    `${riderService}/api/rider/current/order`,
    authConfig(),
  );
  return !current.data.order;
};

export const probeEmptyState = async (
  role: string,
  location: Location | null,
): Promise<InviteReason | null> => {
  try {
    if (role === "seller") return (await probeSeller()) ? "empty-workspace" : null;
    if (role === "rider") return (await probeRider()) ? "empty-workspace" : null;
    if (role === "admin") return null;
    return (await probeCustomer(location)) ? "no-restaurants" : null;
  } catch {
    return "no-restaurants";
  }
};
