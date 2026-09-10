import type { ICart, IMenuItem, IOrder, IRestaurant, OrderStatus } from "../types";
import {
  ORDER_ACTIONS,
  ORDER_PROGRESS_STEPS,
  isActiveOrder,
} from "../utils/orderflow";
import { getDistanceKm } from "../utils/getDistanceKm";
import { getDeliveryFee, PLATFORM_FEE } from "../utils/pricing";
import { demoArt } from "./art";
import {
  AVAILABLE_PULSE_MS,
  DEMO_CITY,
  DEMO_STORAGE_KEY,
  MAX_LIVE_ORDERS,
  RIDER_PING_MS,
  SPAWN_INTERVAL_MS,
  STATUS_DELAY_MS,
  TICK_MS,
} from "./config";
import { DROP_POOL, GUEST_POOL, buildOrder, seedState } from "./data";
import { demoSocket } from "./socket";
import {
  DEMO_ROLES,
  type DemoResult,
  type DemoRole,
  type DemoSeed,
  type DemoState,
} from "./types";

const FALLBACK_RIDERS = [
  { id: "demo-rider-arjun", name: "Arjun Tiwari", phone: 9845512300 },
  { id: "demo-rider-neha", name: "Neha Bisht", phone: 9845588211 },
  { id: "demo-rider-imran", name: "Imran Qureshi", phone: 9845566190 },
];

const match = (pattern: string, path: string): string[] | null => {
  const expected = pattern.split("/");
  const actual = path.split("/");
  if (expected.length !== actual.length) return null;
  const params: string[] = [];
  for (let index = 0; index < expected.length; index += 1) {
    if (expected[index] === "*") {
      params.push(decodeURIComponent(actual[index]));
      continue;
    }
    if (expected[index] !== actual[index]) return null;
  }
  return params;
};

const readBody = (raw: unknown): Record<string, unknown> => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof FormData !== "undefined" && raw instanceof FormData) {
    const parsed: Record<string, unknown> = {};
    raw.forEach((value, key) => {
      parsed[key] = value instanceof File ? value.name : value;
    });
    return parsed;
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return {};
};

const lerp = (from: number, to: number, ratio: number) =>
  from + (to - from) * ratio;

class DemoStore {
  private state: DemoState | null = null;
  private timer: number | null = null;
  private lastPulseAt = 0;
  private lastSpawnAt = 0;
  private lastPingAt = 0;

  get active() {
    return this.state !== null;
  }

  get role(): DemoRole | null {
    return this.state?.role ?? null;
  }

  get origin() {
    return this.state?.origin ?? null;
  }

  get city() {
    return this.state ? DEMO_CITY : null;
  }

  start(role: DemoRole, seed: DemoSeed) {
    this.state = seedState(role, seed);
    this.resetClocks();
    this.persist();
    this.startEngine();
  }

  restore(): DemoRole | null {
    try {
      const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DemoState;
      if (!DEMO_ROLES.includes(parsed.role)) {
        window.localStorage.removeItem(DEMO_STORAGE_KEY);
        return null;
      }
      this.state = parsed;
      this.resetClocks();
      this.startEngine();
      return this.state.role;
    } catch {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
      this.state = null;
      return null;
    }
  }

  stop() {
    this.stopEngine();
    this.state = null;
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
  }

  private resetClocks() {
    const now = Date.now();
    this.lastPulseAt = now;
    this.lastSpawnAt = now;
    this.lastPingAt = now;
  }

  private startEngine() {
    this.stopEngine();
    this.timer = window.setInterval(this.tick, TICK_MS);
  }

  private stopEngine() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  private persist() {
    if (!this.state) return;
    try {
      window.localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify(this.state),
      );
    } catch {
      this.stopEngine();
    }
  }

  private nextId(prefix: string) {
    const state = this.state;
    if (!state) return `${prefix}-0`;
    state.seq += 1;
    return `${prefix}-${state.seq}`;
  }

  private restaurantOf(order: IOrder): IRestaurant | undefined {
    return this.state?.restaurants.find(
      (restaurant) => restaurant._id === order.restaurantId,
    );
  }

  private isRelevant(order: IOrder) {
    const state = this.state;
    if (!state) return false;
    if (state.role === "customer") return order.userId === state.userId;
    if (state.role === "seller") {
      return order.restaurantId === state.myRestaurantId;
    }
    return true;
  }

  private waitsForActor(order: IOrder) {
    const state = this.state;
    if (!state) return false;
    if (
      state.role === "seller" &&
      order.restaurantId === state.myRestaurantId &&
      ORDER_ACTIONS[order.status]
    ) {
      return true;
    }
    if (
      state.role === "rider" &&
      order.riderId === state.rider._id &&
      (order.status === "rider_assigned" || order.status === "picked_up")
    ) {
      return true;
    }
    return false;
  }

  private setStatus(order: IOrder, status: OrderStatus) {
    const state = this.state;
    if (!state) return;
    order.status = status;
    order.updatedAt = new Date();
    delete state.schedule[order._id];

    if (status === "rider_assigned" && !order.riderId) {
      const rider =
        FALLBACK_RIDERS[Math.floor(Math.random() * FALLBACK_RIDERS.length)];
      order.riderId = rider.id;
      order.riderName = rider.name;
      order.riderPhone = rider.phone;
    }
    if (status === "picked_up") {
      state.progress[order._id] = 0;
    }
    if (status === "delivered" || status === "cancelled") {
      delete state.progress[order._id];
      delete state.positions[order._id];
    }

    demoSocket.dispatch("order:update", {
      orderId: order._id,
      status: order.status,
    });
    if (status === "rider_assigned") {
      demoSocket.dispatch("order:rider_assigned", { ...order });
    }
    if (status === "ready_for_rider") {
      demoSocket.dispatch("order:available", { orderId: order._id });
    }
  }

  private advance(order: IOrder) {
    const index = ORDER_PROGRESS_STEPS.indexOf(order.status);
    const next = ORDER_PROGRESS_STEPS[index + 1];
    if (!next) return;
    this.setStatus(order, next);
  }

  private pulseAvailable(now: number, force = false) {
    const state = this.state;
    if (!state || state.role !== "rider" || !state.rider.isAvailable) {
      return false;
    }
    if (!force && now - this.lastPulseAt < AVAILABLE_PULSE_MS) return false;
    this.lastPulseAt = now;
    state.orders
      .filter((order) => order.status === "ready_for_rider" && !order.riderId)
      .forEach((order) =>
        demoSocket.dispatch("order:available", { orderId: order._id }),
      );
    return false;
  }

  private pulseSpawn(now: number) {
    const state = this.state;
    if (!state || state.role === "customer") {
      return false;
    }
    if (now - this.lastSpawnAt < SPAWN_INTERVAL_MS) return false;
    this.lastSpawnAt = now;
    if (state.orders.filter(isActiveOrder).length >= MAX_LIVE_ORDERS) {
      return false;
    }

    const restaurant =
      state.role === "seller"
        ? this.restaurantById(state.myRestaurantId)
        : state.restaurants[
            Math.floor(Math.random() * state.restaurants.length)
          ];
    if (!restaurant) return false;

    const menu = state.items[restaurant._id] ?? [];
    if (menu.length === 0) return false;
    const picked = [
      menu[Math.floor(Math.random() * menu.length)],
      menu[Math.floor(Math.random() * menu.length)],
    ].filter((item, index, list) => list.indexOf(item) === index);

    const order = buildOrder({
      id: this.nextId("demo-order-spawn"),
      userId: `demo-guest-${Math.floor(Math.random() * GUEST_POOL.length) + 1}`,
      restaurant,
      items: picked,
      status: state.role === "seller" ? "placed" : "ready_for_rider",
      origin: state.origin,
      drop: DROP_POOL[Math.floor(Math.random() * DROP_POOL.length)],
      minutesAgo: 0,
    });
    state.orders = [order, ...state.orders];
    demoSocket.dispatch("order:new", {
      orderId: order._id,
      status: order.status,
    });
    if (order.status === "ready_for_rider") {
      demoSocket.dispatch("order:available", { orderId: order._id });
    }
    return true;
  }

  private pulseRiderLocation(now: number) {
    const state = this.state;
    if (!state) return false;
    if (now - this.lastPingAt < RIDER_PING_MS) return false;
    this.lastPingAt = now;

    let changed = false;
    state.orders
      .filter(
        (order) =>
          order.status === "picked_up" || order.status === "rider_assigned",
      )
      .forEach((order) => {
        const restaurant = this.restaurantOf(order);
        if (!restaurant) return;
        const span = STATUS_DELAY_MS.picked_up ?? 40000;
        const ratio =
          order.status === "rider_assigned"
            ? 0
            : Math.min(
                1,
                (state.progress[order._id] ?? 0) + RIDER_PING_MS / span,
              );
        state.progress[order._id] = ratio;
        const [restLng, restLat] = restaurant.autoLocation.coordinates;
        const position: [number, number] = [
          lerp(restLat, order.deliveryAddress.latitude, ratio),
          lerp(restLng, order.deliveryAddress.longitude, ratio),
        ];
        state.positions[order._id] = position;
        demoSocket.dispatch("rider:location", {
          orderId: order._id,
          latitude: position[0],
          longitude: position[1],
        });
        changed = true;
      });
    return changed;
  }

  private tick = () => {
    const state = this.state;
    if (!state) return;
    const now = Date.now();
    let changed = false;

    state.orders.forEach((order) => {
      if (!isActiveOrder(order)) return;
      if (!this.isRelevant(order)) return;
      if (this.waitsForActor(order)) return;
      const due = state.schedule[order._id];
      if (due === undefined) {
        state.schedule[order._id] =
          now + (STATUS_DELAY_MS[order.status] ?? 12000);
        changed = true;
        return;
      }
      if (now < due) return;
      this.advance(order);
      changed = true;
    });

    changed = this.pulseAvailable(now) || changed;
    changed = this.pulseSpawn(now) || changed;
    changed = this.pulseRiderLocation(now) || changed;
    if (changed) this.persist();
  };

  private restaurantById(id: string) {
    return this.state?.restaurants.find((restaurant) => restaurant._id === id);
  }

  private itemById(id: string): IMenuItem | undefined {
    const state = this.state;
    if (!state) return undefined;
    for (const list of Object.values(state.items)) {
      const found = list.find((item) => item._id === id);
      if (found) return found;
    }
    return undefined;
  }

  private searchRestaurants(term: string) {
    const state = this.state;
    if (!state) return [];
    const query = term.trim().toLowerCase();
    if (!query) return state.restaurants;
    return state.restaurants.filter((restaurant) => {
      const haystack = [
        restaurant.name,
        restaurant.description ?? "",
        ...(state.keywords[restaurant._id] ?? []),
        ...(state.items[restaurant._id] ?? []).map((item) => item.name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  private populatedCart(): { cart: ICart[]; totalPrice: number; cartLength: number } {
    const state = this.state;
    if (!state) return { cart: [], totalPrice: 0, cartLength: 0 };
    const cart: ICart[] = [];
    let totalPrice = 0;
    let cartLength = 0;
    state.cart.forEach((line) => {
      const restaurant = this.restaurantById(line.restaurantId);
      const item = this.itemById(line.itemId);
      if (!restaurant || !item) return;
      totalPrice += item.price * line.quantity;
      cartLength += line.quantity;
      cart.push({
        userId: state.userId,
        restaurantId: restaurant,
        itemId: item,
        quantity: line.quantity,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    return { cart, totalPrice, cartLength };
  }

  private createOrder(
    restaurantId: string,
    addressId: string,
    paymentMethod: string,
  ): DemoResult {
    const state = this.state;
    if (!state) return { status: 400, data: { message: "Demo is inactive" } };
    const restaurant = this.restaurantById(restaurantId);
    const address = state.addresses.find(
      (candidate) => candidate._id === addressId,
    );
    if (!restaurant || !address) {
      return { status: 400, data: { message: "Invalid order request" } };
    }
    const lines = state.cart.filter(
      (line) => line.restaurantId === restaurantId,
    );
    if (lines.length === 0) {
      return { status: 400, data: { message: "Your cart is empty" } };
    }

    const orderItems = lines.flatMap((line) => {
      const item = this.itemById(line.itemId);
      if (!item) return [];
      return [
        {
          itemId: item._id,
          name: item.name,
          quantity: line.quantity,
          price: item.price,
        },
      ];
    });
    const subTotal = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const deliveryFee = getDeliveryFee(subTotal);
    const [addrLng, addrLat] = address.location.coordinates;
    const [restLng, restLat] = restaurant.autoLocation.coordinates;
    const distance = getDistanceKm(restLat, restLng, addrLat, addrLng);
    const id = this.nextId("demo-order");

    const order: IOrder = {
      _id: id,
      userId: state.userId,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      riderId: null,
      riderName: null,
      riderPhone: null,
      distance,
      riderAmount: 30 + Math.round(distance * 8),
      items: orderItems,
      subTotal,
      deliveryFee,
      platformFee: PLATFORM_FEE,
      totalAmount: subTotal + deliveryFee + PLATFORM_FEE,
      addressId: address._id,
      deliveryAddress: {
        formattedAddress: address.formattedAddress,
        mobile: address.mobile,
        latitude: addrLat,
        longitude: addrLng,
      },
      status: "placed",
      paymentMethod: paymentMethod === "stripe" ? "stripe" : "razorpay",
      paymentStatus: "paid",
      paymentId: `demo-pay-${id}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    state.orders = [order, ...state.orders];
    state.cart = state.cart.filter(
      (line) => line.restaurantId !== restaurantId,
    );
    this.persist();
    demoSocket.dispatch("order:new", { orderId: order._id, status: "placed" });
    return { data: { orderId: order._id, order, success: true } };
  }

  handle(
    method: string,
    path: string,
    rawBody: unknown,
    query: URLSearchParams,
  ): DemoResult | null {
    const state = this.state;
    if (!state) return null;
    const body = readBody(rawBody);
    const on = (verb: string, pattern: string) =>
      method === verb ? match(pattern, path) : null;
    let params: string[] | null;

    if (on("GET", "/api/restaurant/nearby")) {
      return {
        data: { restaurants: this.searchRestaurants(query.get("search") ?? "") },
      };
    }
    if (on("GET", "/api/restaurant/my")) {
      const restaurant = this.restaurantById(state.myRestaurantId);
      if (!restaurant) {
        return { status: 404, data: { message: "No restaurant found" } };
      }
      return { data: { restaurant } };
    }
    if (on("PUT", "/api/restaurant/status")) {
      const restaurant = this.restaurantById(state.myRestaurantId);
      if (!restaurant) {
        return { status: 404, data: { message: "No restaurant found" } };
      }
      restaurant.isOpen = Boolean(body.status);
      this.persist();
      return { data: { restaurant } };
    }
    if (on("PUT", "/api/restaurant/edit")) {
      const restaurant = this.restaurantById(state.myRestaurantId);
      if (!restaurant) {
        return { status: 404, data: { message: "No restaurant found" } };
      }
      if (typeof body.name === "string" && body.name.trim()) {
        restaurant.name = body.name.trim();
      }
      if (typeof body.description === "string") {
        restaurant.description = body.description;
      }
      state.orders.forEach((order) => {
        if (order.restaurantId === restaurant._id) {
          order.restaurantName = restaurant.name;
        }
      });
      this.persist();
      return { data: { restaurant } };
    }
    if (on("PATCH", "/api/restaurant/sound")) {
      const restaurant = this.restaurantById(state.myRestaurantId);
      const soundEnabled = Boolean(body.soundEnabled);
      if (restaurant) restaurant.soundEnabled = soundEnabled;
      this.persist();
      return { data: { soundEnabled } };
    }
    if ((params = on("GET", "/api/restaurant/*"))) {
      const restaurant = this.restaurantById(params[0]);
      if (!restaurant) {
        return { status: 404, data: { message: "Restaurant not found" } };
      }
      return { data: { restaurant } };
    }

    if ((params = on("GET", "/api/item/all/*"))) {
      return { data: { items: state.items[params[0]] ?? [] } };
    }
    if (on("POST", "/api/item/new")) {
      const restaurant = this.restaurantById(state.myRestaurantId);
      if (!restaurant) {
        return { status: 404, data: { message: "No restaurant found" } };
      }
      const item: IMenuItem = {
        _id: this.nextId("demo-item"),
        restaurantId: restaurant._id,
        name: String(body.name ?? "New dish"),
        description: String(body.description ?? ""),
        price: Number(body.price ?? 0),
        image: demoArt("biryani"),
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.items[restaurant._id] = [item, ...(state.items[restaurant._id] ?? [])];
      this.persist();
      return { data: { item, message: "Dish added" } };
    }
    if ((params = on("PUT", "/api/item/status/*"))) {
      const item = this.itemById(params[0]);
      if (!item) return { status: 404, data: { message: "Item not found" } };
      item.isAvailable = !item.isAvailable;
      this.persist();
      return {
        data: {
          message: item.isAvailable ? "Item resumed" : "Item paused",
          item,
        },
      };
    }
    if ((params = on("DELETE", "/api/item/*"))) {
      Object.keys(state.items).forEach((key) => {
        state.items[key] = state.items[key].filter(
          (item) => item._id !== params?.[0],
        );
      });
      this.persist();
      return { data: { message: "Item deleted" } };
    }

    if (on("GET", "/api/cart/all")) {
      return { data: this.populatedCart() };
    }
    if (on("POST", "/api/cart/add")) {
      const restaurantId = String(body.restaurantId ?? "");
      const itemId = String(body.itemId ?? "");
      if (
        state.cart.length > 0 &&
        state.cart[0].restaurantId !== restaurantId
      ) {
        return {
          status: 400,
          data: {
            message:
              "Your cart has dishes from another kitchen. Clear it to continue.",
          },
        };
      }
      const existing = state.cart.find((line) => line.itemId === itemId);
      if (existing) existing.quantity += 1;
      else state.cart.push({ restaurantId, itemId, quantity: 1 });
      this.persist();
      return { data: { message: "Added to cart" } };
    }
    if (on("PUT", "/api/cart/incr")) {
      const line = state.cart.find((entry) => entry.itemId === body.itemId);
      if (line) line.quantity += 1;
      this.persist();
      return { data: { message: "Quantity updated" } };
    }
    if (on("PUT", "/api/cart/decr")) {
      const line = state.cart.find((entry) => entry.itemId === body.itemId);
      if (line) {
        line.quantity -= 1;
        if (line.quantity <= 0) {
          state.cart = state.cart.filter((entry) => entry !== line);
        }
      }
      this.persist();
      return { data: { message: "Quantity updated" } };
    }
    if (on("DELETE", "/api/cart/clear")) {
      state.cart = [];
      this.persist();
      return { data: { message: "Cart cleared" } };
    }

    if (on("GET", "/api/address/get")) {
      return { data: { addresses: state.addresses } };
    }
    if (on("POST", "/api/address/add")) {
      const address = {
        _id: this.nextId("demo-address"),
        userId: state.userId,
        formattedAddress: String(body.formattedAddress ?? "Demo address"),
        mobile: Number(body.mobile ?? 9800000000),
        location: {
          type: "Point" as const,
          coordinates: [
            Number(body.longitude ?? state.origin.longitude),
            Number(body.latitude ?? state.origin.latitude),
          ] as [number, number],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.addresses = [address, ...state.addresses];
      this.persist();
      return { data: { address, message: "Address saved" } };
    }
    if ((params = on("DELETE", "/api/address/delete/*"))) {
      state.addresses = state.addresses.filter(
        (address) => address._id !== params?.[0],
      );
      this.persist();
      return { data: { message: "Address removed" } };
    }

    if (on("POST", "/api/order/new")) {
      return this.createOrder(
        String(body.restaurantId ?? ""),
        String(body.addressId ?? ""),
        String(body.paymentMethod ?? "razorpay"),
      );
    }
    if (on("GET", "/api/order/my")) {
      return {
        data: {
          orders: state.orders.filter((order) => order.userId === state.userId),
        },
      };
    }
    if ((params = on("GET", "/api/order/restaurant/*"))) {
      return {
        data: {
          orders: state.orders.filter(
            (order) => order.restaurantId === params?.[0],
          ),
        },
      };
    }
    if ((params = on("GET", "/api/order/*"))) {
      const order = state.orders.find((entry) => entry._id === params?.[0]);
      if (!order) return { status: 404, data: { message: "Order not found" } };
      return { data: { order } };
    }
    if ((params = on("PUT", "/api/order/*"))) {
      const order = state.orders.find((entry) => entry._id === params?.[0]);
      if (!order) return { status: 404, data: { message: "Order not found" } };
      this.setStatus(order, body.status as OrderStatus);
      this.persist();
      return { data: { order, message: "Order updated" } };
    }

    if (on("GET", "/api/rider/myprofile")) {
      return { data: state.rider };
    }
    if (on("POST", "/api/rider/new")) {
      state.rider = {
        ...state.rider,
        phoneNumber: String(body.phoneNumber ?? state.rider.phoneNumber),
        aadharNumber: String(body.aadharNumber ?? state.rider.aadharNumber),
        drivingLicenseNumber: String(
          body.drivingLicenseNumber ?? state.rider.drivingLicenseNumber,
        ),
        isVerified: true,
      };
      this.persist();
      return { data: { rider: state.rider, message: "Rider profile created" } };
    }
    if (on("PATCH", "/api/rider/sound")) {
      state.rider.soundEnabled = Boolean(body.soundEnabled);
      this.persist();
      return { data: { soundEnabled: state.rider.soundEnabled } };
    }
    if (on("PATCH", "/api/rider/toggle")) {
      state.rider = {
        ...state.rider,
        isAvailable: Boolean(body.isAvailable),
        lastActiveAt: new Date().toISOString(),
      };
      this.persist();
      this.pulseAvailable(Date.now(), true);
      return { data: { rider: state.rider } };
    }
    if (on("GET", "/api/rider/current/order")) {
      const order = state.orders.find(
        (entry) => entry.riderId === state.rider._id && isActiveOrder(entry),
      );
      return { data: { order: order ?? null } };
    }
    if ((params = on("POST", "/api/rider/accept/*"))) {
      const order = state.orders.find((entry) => entry._id === params?.[0]);
      if (!order) return { status: 404, data: { message: "Order not found" } };
      if (order.riderId) {
        return {
          status: 400,
          data: { message: "Another rider already claimed this order" },
        };
      }
      order.riderId = state.rider._id;
      order.riderName = state.userName;
      order.riderPhone = Number(state.rider.phoneNumber);
      this.setStatus(order, "rider_assigned");
      this.persist();
      return { data: { order, message: "Order accepted" } };
    }
    if ((params = on("PUT", "/api/rider/order/update/*"))) {
      const order = state.orders.find((entry) => entry._id === params?.[0]);
      if (!order) return { status: 404, data: { message: "Order not found" } };
      if (order.status === "rider_assigned") this.setStatus(order, "picked_up");
      else if (order.status === "picked_up") this.setStatus(order, "delivered");
      this.persist();
      return { data: { order, message: "Order updated" } };
    }

    if (on("GET", "/api/geocode/reverse")) {
      return {
        data: {
          display_name: state.origin.formattedAddress,
          address: { city: DEMO_CITY },
        },
      };
    }
    if (on("POST", "/api/internal/emit")) {
      return { data: { ok: true } };
    }
    if ((params = on("GET", "/api/internal/rider-location/*"))) {
      const position = state.positions[params?.[0] ?? ""];
      if (!position) {
        return { status: 404, data: { message: "No cached location" } };
      }
      return { data: { latitude: position[0], longitude: position[1] } };
    }

    if (path.startsWith("/api/payment")) {
      return { data: { success: true, demo: true } };
    }

    return null;
  }
}

export const demoStore = new DemoStore();
