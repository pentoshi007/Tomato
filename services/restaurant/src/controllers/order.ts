import TryCatch from "../middlewares/trycatch.js";
import { Response } from "express";
import Order from "../models/Order.js";
import type { IOrder } from "../models/Order.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import Cart from "../models/cart.js";
import Address from "../models/Address.js";
import { IRestaurant } from "../models/Restaurant.js";
import type { IMenuItems } from "../models/MenuItems.js";
import { getDistanceKm } from "../utils/getDistanceKm.js";
import Restaurant from "../models/Restaurant.js";
import {
  ORDER_REALTIME_EVENTS,
  buildOrderPayload,
  emitRealtime,
} from "../utils/realtime.js";
import { publishEvent } from "../config/order.publisher.js";
import { startDemoKitchen } from "../config/demoKitchen.js";
import axios from "axios";

// Centralized pricing config (single source of truth for the backend).
const FREE_DELIVERY_THRESHOLD = 250;
const DELIVERY_FEE = 49;
const PLATFORM_FEE = 5;
const MAX_DELIVERY_DISTANCE_KM = 10;
const RIDER_RATE_PER_KM = 17;

const calculateRiderAmount = (distance: number) =>
  Math.ceil(
    Math.min(Math.max(distance, 0), MAX_DELIVERY_DISTANCE_KM),
  ) * RIDER_RATE_PER_KM;

export const createOrder = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized, you are not a user" });
      return;
    }
    const body = req.body as {
      restaurantId?: string;
      addressId?: string;
      paymentMethod?: "razorpay" | "stripe";
    };
    const { restaurantId, addressId, paymentMethod = "stripe" } = body;
    if (!restaurantId || !addressId) {
      res.status(400).json({ message: "Restaurant and address are required" });
      return;
    }

    const cartItems = await Cart.find({ userId: user._id, restaurantId })
      .populate("itemId")
      .populate("restaurantId");
    if (!cartItems) {
      res.status(404).json({ message: "No items found in cart" });
      return;
    }
    if (cartItems.length === 0) {
      res.status(400).json({ message: "No items found in cart" });
      return;
    }
    const restaurant = cartItems[0]?.restaurantId as unknown as IRestaurant;
    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }
    if (!restaurant.isOpen) {
      res.status(400).json({ message: "Restaurant is not open" });
      return;
    }

    const address = await Address.findOne({ _id: addressId, userId: user._id });
    if (!address) {
      res.status(404).json({ message: "Address not found" });
      return;
    }

    let subTotal = 0;
    const items: IOrder["items"] = [];
    for (const cartItem of cartItems) {
      const menuItem = cartItem.itemId as unknown as IMenuItems | null;
      if (!menuItem) {
        res.status(404).json({ message: "Item not found" });
        return;
      }

      subTotal += menuItem.price * cartItem.quantity;
      items.push({
        itemId: menuItem._id,
        name: menuItem.name,
        quantity: cartItem.quantity,
        price: menuItem.price,
      });
    }

    const deliveryFee = subTotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
    const platformFee = PLATFORM_FEE;
    const totalAmount = subTotal + deliveryFee + platformFee;
    const restaurantName = restaurant.name;

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const deliveryAddress: IOrder["deliveryAddress"] = {
      formattedAddress: address.formattedAddress,
      mobile: address.mobile,
      latitude: address.location.coordinates[1],
      longitude: address.location.coordinates[0],
    };

    // Compute distance server-side from trusted coordinates instead of
    // trusting a client-supplied value (which controls the rider payout).
    const [restLng, restLat] = restaurant.autoLocation.coordinates;
    const [addrLng, addrLat] = address.location.coordinates;
    const distance = getDistanceKm(restLat, restLng, addrLat, addrLng);
    if (distance > MAX_DELIVERY_DISTANCE_KM) {
      res.status(400).json({
        message: `Delivery is only available within ${MAX_DELIVERY_DISTANCE_KM} km of the restaurant`,
        distance,
        maxDistance: MAX_DELIVERY_DISTANCE_KM,
      });
      return;
    }
    const riderAmount = calculateRiderAmount(distance);

    const order = await Order.create({
      userId: user._id,
      restaurantId,
      restaurantName,
      riderId: null,
      distance,
      riderAmount,
      items,
      subTotal,
      deliveryFee,
      platformFee,
      totalAmount,
      addressId,
      deliveryAddress,
      paymentMethod,
      paymentStatus: "pending",
      paymentId: "",
      status: "placed",
      type: restaurant.type === "demo" ? "demo" : "normal",
      expiresAt,
    });
    await Cart.deleteMany({
      userId: user._id,
      restaurantId,
    });

    res
      .status(201)
      .json({ orderId: order._id, message: "Order created successfully" });
  },
);

export const fetchOrderForPayment = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res
      .status(401)
      .json({ message: "Unauthorized, you are not an internal service" });
  }
  const orderId = (req as any).params?.orderId;
  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (order.paymentStatus !== "pending") {
    return res.status(400).json({ message: "Order is already paid or failed" });
  }
  if (order.expiresAt && order.expiresAt < new Date()) {
    return res.status(400).json({ message: "Order has expired" });
  }
  if (order.status !== "placed") {
    return res.status(400).json({ message: "Order is not placed" });
  }
  return res.status(200).json({
    success: true,
    orderId: order._id,
    message: "Order fetched successfully",
    currency: "INR",
    amount: order.totalAmount,
    expiresAt: order.expiresAt,
  });
});

export const fetchRestaurantOrders = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const restaurantId = req.params.restaurantId;

    if (!user) {
      res.status(401).json({ message: "Unauthorized, you are not a user" });
      return;
    }
    if (!restaurantId) {
      res.status(400).json({ message: "Restaurant ID is required" });
      return;
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }
    if (restaurant.ownerId.toString() !== user._id.toString()) {
      res
        .status(403)
        .json({ message: "Forbidden, you do not own this restaurant" });
      return;
    }

    const limit = req.query.limit ? Number(req.query.limit) : 0;
    const query = Order.find({ restaurantId, paymentStatus: "paid" }).sort({
      createdAt: -1,
    });
    if (Number.isFinite(limit) && limit > 0) {
      query.limit(limit);
    }
    const orders = await query;
    return res
      .status(200)
      .json({ success: true, count: orders.length, orders });
  },
);

export const updateOrderStatus = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const orderId = req.params.orderId;
    const status = req.body?.status as string;
    const ALLOWED_STATUSES = [
      "accepted",
      "preparing",
      "ready_for_rider",
    ] as const;

    if (!user) {
      res.status(401).json({ message: "Unauthorized, you are not a user" });
      return;
    }
    if (!orderId) {
      res.status(400).json({ message: "Order ID is required" });
      return;
    }
    if (!status) {
      res.status(400).json({ message: "Status is required" });
      return;
    }
    if (
      !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])
    ) {
      res.status(400).json({ message: "Invalid order status" });
      return;
    }
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    if (order.paymentStatus !== "paid") {
      res.status(400).json({ message: "Cannot update status of unpaid order" });
      return;
    }

    const restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }
    if (restaurant.ownerId.toString() !== user._id.toString()) {
      res
        .status(403)
        .json({ message: "Forbidden, you do not own this restaurant" });
      return;
    }
    if (!restaurant.isOpen) {
      res.status(400).json({
        message: "Cannot update status of order for closed restaurant",
      });
      return;
    }

    order.status = status as IOrder["status"];
    await order.save();
    await emitRealtime(
      ORDER_REALTIME_EVENTS.UPDATE,
      `user:${order.userId.toString()}`,
      buildOrderPayload(order),
    );

    //now assigning riders
    if (status === "ready_for_rider") {
      console.log("Order is ready for rider");
      await publishEvent("ORDER_READY_FOR_RIDER", {
        orderId: order._id.toString(),
        restaurantId: order.restaurantId.toString(),
        location: restaurant.autoLocation,
        demo: restaurant.type === "demo",
        demoClusterKey: restaurant.demoClusterKey,
        delivery: {
          latitude: order.deliveryAddress.latitude,
          longitude: order.deliveryAddress.longitude,
          userId: order.userId.toString(),
        },
      });
      console.log("Event published to rider queue");
    }
    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  },
);

export const getMyOrders = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized you are not a user" });
      return;
    }
    const orders = await Order.find({
      userId: user._id,
      paymentStatus: "paid",
    }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  },
);

export const fetchSingleOrder = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized you are not a user" });
      return;
    }
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    if (order.userId.toString() !== user._id.toString()) {
      res.status(403).json({ message: "Forbidden you do not own this order" });
      return;
    }
    res.json({ success: true, order });
  },
);

export const assignRiderToOrder = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res
      .status(401)
      .json({ message: "Unauthorized, you are not an internal service" });
  }
  const { orderId, riderId, riderName, riderPhone } = req.body;
  if (!orderId || !riderId || !riderName || !riderPhone) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (order.riderId !== null) {
    return res
      .status(400)
      .json({ message: "Order already taken by another rider" });
  }
  const activeDelivery = await Order.findOne({
    riderId,
    status: { $nin: ["delivered", "cancelled"] },
  });
  if (activeDelivery) {
    return res.status(400).json({
      message: "Rider already has an active order",
      success: false,
    });
  }
  const orderUpdated = await Order.findByIdAndUpdate(
    { _id: orderId, riderId: null },
    {
      riderId: riderId,
      riderName: riderName,
      riderPhone: riderPhone,
      status: "rider_assigned",
    },
    { new: true },
  );

  if (!orderUpdated) {
    return res.status(400).json({
      message: "Failed to assign rider to order",
      order: order,
      success: false,
    });
  }

  // Emit the post-assignment document so consumers see riderId/status as
  // saved, and only when the assignment actually won the race.
  await axios.post(
    `${process.env.REALTIME_SERVICE_URL}/api/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `user:${orderUpdated.userId.toString()}`,
      payload: orderUpdated,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    },
  );
  await axios.post(
    `${process.env.REALTIME_SERVICE_URL}/api/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `restaurant:${orderUpdated.restaurantId.toString()}`,
      payload: orderUpdated,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    },
  );
  return res.status(200).json({
    message: "Rider assigned to order successfully",
    order: orderUpdated,
    success: true,
  });
});

type OrderRoutePayload = {
  phase: "pickup" | "delivery";
  path: [number, number][];
  startedAt: number;
  durationMs: number;
};

const parseRoutePayload = (value: unknown): OrderRoutePayload | null => {
  if (typeof value !== "object" || value === null) return null;
  const route = value as Record<string, unknown>;
  if (route.phase !== "pickup" && route.phase !== "delivery") return null;
  if (!Array.isArray(route.path) || route.path.length < 2) return null;
  const path: [number, number][] = [];
  for (const point of route.path) {
    if (!Array.isArray(point) || point.length < 2) return null;
    const latitude = Number(point[0]);
    const longitude = Number(point[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    path.push([latitude, longitude]);
  }
  const startedAt = Number(route.startedAt);
  const durationMs = Number(route.durationMs);
  if (
    !Number.isFinite(startedAt) ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  ) {
    return null;
  }
  return { phase: route.phase, path, startedAt, durationMs };
};

export const persistOrderRoute = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res
      .status(401)
      .json({ message: "Unauthorized, you are not an internal service" });
  }
  const { orderId } = req.body as { orderId?: string };
  const route = parseRoutePayload((req.body as Record<string, unknown>).route);
  if (!orderId || !route) {
    return res
      .status(400)
      .json({ message: "orderId and a valid route are required" });
  }
  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      activeRoute: {
        phase: route.phase,
        path: route.path,
        startedAt: new Date(route.startedAt),
        durationMs: route.durationMs,
      },
    },
    { new: true },
  );
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  return res.status(200).json({ success: true, order });
});

export const fetchPreviousDemoRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res
      .status(401)
      .json({ message: "Unauthorized, you are not an internal service" });
  }
  const { userId, before } = req.query;
  if (!userId || !before) {
    return res.status(400).json({ message: "userId and before are required" });
  }
  const beforeDate = new Date(String(before));
  if (Number.isNaN(beforeDate.getTime())) {
    return res.status(400).json({ message: "before must be a valid date" });
  }
  const order = await Order.findOne({
    userId,
    type: "demo",
    riderId: { $ne: null },
    createdAt: { $lt: beforeDate },
  })
    .sort({ createdAt: -1 })
    .select("riderId")
    .lean();
  return res.status(200).json({ riderId: order?.riderId?.toString() ?? null });
});

export const getCurrentOrdersForRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res
      .status(401)
      .json({ message: "Unauthorized, you are not an internal service" });
  }
  const { riderId } = req.query;
  if (!riderId) {
    return res.status(400).json({ message: "Rider ID is required" });
  }
  const order = await Order.findOne({
    riderId,
    status: {
      $nin: ["delivered", "cancelled"],
    },
  }).populate("restaurantId");
  if (!order) {
    return res.status(404).json({ message: "No orders found for rider" });
  }

  // Repair active orders created before the delivery-distance guard existed.
  const expectedRiderAmount = calculateRiderAmount(order.distance);
  if (order.riderAmount !== expectedRiderAmount) {
    order.riderAmount = expectedRiderAmount;
    await order.save();
  }

  return res.status(200).json({ success: true, order });
});

export const updateOrderStatusRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res
      .status(401)
      .json({ message: "Unauthorized, you are not an internal service" });
  }
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (order.status == "rider_assigned") {
    order.status = "picked_up";

    await order.save();
    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId.toString()}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );
    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId.toString()}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    return res.status(200).json({
      success: true,
      order,
      message: "Order status updated successfully",
    });
  }
  if (order.status == "picked_up") {
    order.status = "delivered";

    await order.save();
    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId.toString()}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );
    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId.toString()}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    return res.status(200).json({
      success: true,
      order,
      message: "Order status updated successfully",
    });
  }
});
