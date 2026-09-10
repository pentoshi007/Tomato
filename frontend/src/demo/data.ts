import type {
  IAddress,
  IMenuItem,
  IOrder,
  IOrderItem,
  IRestaurant,
  IRider,
  Location,
  OrderStatus,
} from "../types";
import { getDistanceKm } from "../utils/getDistanceKm";
import { getDeliveryFee, PLATFORM_FEE } from "../utils/pricing";
import { demoArt, type ArtKind } from "./art";
import { DEMO_ORIGIN } from "./config";
import type { DemoSeed, DemoState } from "./types";

const KM_PER_DEG_LAT = 110.574;

const kmPerDegLng = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);

const offset = (
  origin: Location,
  km: number,
  bearing: number,
): [number, number] => {
  const rad = (bearing * Math.PI) / 180;
  const lat = origin.latitude + (km * Math.cos(rad)) / KM_PER_DEG_LAT;
  const lng =
    origin.longitude + (km * Math.sin(rad)) / kmPerDegLng(origin.latitude);
  return [lng, lat];
};

interface DishBlueprint {
  name: string;
  description: string;
  price: number;
  art: ArtKind;
  soldOut?: boolean;
}

interface RestaurantBlueprint {
  slug: string;
  name: string;
  description: string;
  art: ArtKind;
  km: number;
  bearing: number;
  area: string;
  isOpen: boolean;
  keywords: string[];
  dishes: DishBlueprint[];
}

const BLUEPRINTS: RestaurantBlueprint[] = [
  {
    slug: "napoli",
    name: "Napoli Corner",
    description:
      "Wood-fired Neapolitan pizzas with a 48-hour cold-proofed dough.",
    art: "pizza",
    km: 0.8,
    bearing: 40,
    area: "Green Park Market",
    isOpen: true,
    keywords: ["pizza", "italian", "pasta", "cheese"],
    dishes: [
      {
        name: "Margherita Classica",
        description: "San Marzano tomato, fior di latte, torn basil.",
        price: 329,
        art: "pizza",
      },
      {
        name: "Truffle Mushroom Pizza",
        description: "Cremini, truffle oil, mozzarella, black pepper.",
        price: 449,
        art: "pizza",
      },
      {
        name: "Diavola Pepperoni",
        description: "Spicy pepperoni, chilli honey drizzle, oregano.",
        price: 419,
        art: "pizza",
      },
      {
        name: "Garlic Parm Fries",
        description: "Hand-cut fries tossed in garlic butter and parmesan.",
        price: 169,
        art: "fries",
      },
      {
        name: "Tiramisu Cup",
        description: "Espresso-soaked savoiardi, mascarpone cream, cocoa.",
        price: 189,
        art: "dessert",
      },
      {
        name: "Basil Lemonade",
        description: "Cold-pressed lemon, muddled basil, sparkling water.",
        price: 129,
        art: "shake",
      },
    ],
  },
  {
    slug: "smash",
    name: "Smash & Stack",
    description: "Thin-crust smash patties, brioche buns, house pickles.",
    art: "burger",
    km: 1.4,
    bearing: 145,
    area: "Yusuf Sarai",
    isOpen: true,
    keywords: ["burger", "american", "fries", "shake"],
    dishes: [
      {
        name: "Double Smash Cheeseburger",
        description: "Two seared patties, aged cheddar, smash sauce.",
        price: 359,
        art: "burger",
      },
      {
        name: "Crispy Chicken Burger",
        description: "Buttermilk-brined thigh, slaw, sriracha mayo.",
        price: 329,
        art: "burger",
      },
      {
        name: "Paneer Peri Burger",
        description: "Charred paneer slab, peri peri glaze, onion crisps.",
        price: 289,
        art: "burger",
      },
      {
        name: "Loaded Cheese Fries",
        description: "Fries under molten cheddar, jalapeño, scallions.",
        price: 199,
        art: "fries",
      },
      {
        name: "Salted Caramel Shake",
        description: "Thick vanilla shake, salted caramel swirl.",
        price: 219,
        art: "shake",
      },
      {
        name: "Choco Fudge Brownie",
        description: "Fudgy centre, dark chocolate ganache, sea salt.",
        price: 159,
        art: "dessert",
        soldOut: true,
      },
    ],
  },
  {
    slug: "dumpukht",
    name: "Dum Pukht House",
    description: "Slow-sealed handi biryanis and Awadhi kebabs.",
    art: "biryani",
    km: 2.1,
    bearing: 255,
    area: "Safdarjung Enclave",
    isOpen: true,
    keywords: ["biryani", "indian", "kebab", "curry", "rice"],
    dishes: [
      {
        name: "Lucknowi Mutton Biryani",
        description: "Long-grain rice, slow-cooked mutton, kewra finish.",
        price: 489,
        art: "biryani",
      },
      {
        name: "Chicken Dum Biryani",
        description: "Sealed handi, saffron rice, birista, mint chutney.",
        price: 399,
        art: "biryani",
      },
      {
        name: "Subz Dum Biryani",
        description: "Seasonal vegetables, whole spices, fried onion.",
        price: 329,
        art: "biryani",
      },
      {
        name: "Galouti Kebab Platter",
        description: "Melt-in-mouth mince kebabs with warqi paratha.",
        price: 379,
        art: "taco",
      },
      {
        name: "Shahi Tukda",
        description: "Saffron rabdi over fried bread, pistachio crumble.",
        price: 179,
        art: "dessert",
      },
      {
        name: "Rose Falooda",
        description: "Rose milk, vermicelli, basil seeds, kulfi scoop.",
        price: 199,
        art: "shake",
      },
    ],
  },
  {
    slug: "taco",
    name: "El Taco Loco",
    description: "Street-style tacos, corn tortillas pressed to order.",
    art: "taco",
    km: 2.8,
    bearing: 320,
    area: "Munirka",
    isOpen: true,
    keywords: ["taco", "mexican", "burrito", "nachos"],
    dishes: [
      {
        name: "Al Pastor Tacos",
        description: "Marinated pork, charred pineapple, coriander.",
        price: 319,
        art: "taco",
      },
      {
        name: "Baja Fish Tacos",
        description: "Crisp fish, chipotle crema, cabbage slaw.",
        price: 349,
        art: "taco",
      },
      {
        name: "Rajma Chipotle Burrito",
        description: "Cilantro rice, smoky rajma, pico, guacamole.",
        price: 299,
        art: "biryani",
      },
      {
        name: "Cheesy Nacho Basket",
        description: "Blue corn chips, queso, pickled jalapeño.",
        price: 229,
        art: "fries",
      },
      {
        name: "Churros con Chocolate",
        description: "Cinnamon sugar churros, dark chocolate dip.",
        price: 189,
        art: "dessert",
      },
      {
        name: "Horchata Cooler",
        description: "Cinnamon rice milk, served over ice.",
        price: 149,
        art: "shake",
      },
    ],
  },
  {
    slug: "sugar",
    name: "Sugar Riot",
    description: "A dessert bar for people who order dessert first.",
    art: "dessert",
    km: 3.4,
    bearing: 200,
    area: "Malviya Nagar",
    isOpen: true,
    keywords: ["dessert", "bakery", "donut", "cake", "shake"],
    dishes: [
      {
        name: "Biscoff Cream Donut",
        description: "Brioche donut filled with Biscoff mousse.",
        price: 169,
        art: "dessert",
      },
      {
        name: "Molten Lava Jar",
        description: "Warm chocolate sponge, gooey centre, cocoa nibs.",
        price: 199,
        art: "dessert",
      },
      {
        name: "Basque Cheesecake Slice",
        description: "Burnt-top cheesecake, jammy centre.",
        price: 249,
        art: "dessert",
      },
      {
        name: "Oreo Thick Shake",
        description: "Cookie-loaded shake with whipped cream crown.",
        price: 229,
        art: "shake",
      },
      {
        name: "Cold Brew Affogato",
        description: "Vanilla gelato drowned in single-origin cold brew.",
        price: 209,
        art: "shake",
      },
      {
        name: "Cinnamon Sugar Fries",
        description: "Sweet potato fries dusted with cinnamon sugar.",
        price: 159,
        art: "fries",
      },
    ],
  },
  {
    slug: "shake",
    name: "Shake Society",
    description: "Small-batch shakes, sundaes and cold coffee flights.",
    art: "shake",
    km: 4.2,
    bearing: 80,
    area: "Lajpat Nagar",
    isOpen: true,
    keywords: ["shake", "coffee", "smoothie", "dessert"],
    dishes: [
      {
        name: "Belgian Chocolate Shake",
        description: "70% cocoa, whole milk, chocolate shavings.",
        price: 239,
        art: "shake",
      },
      {
        name: "Alphonso Mango Smoothie",
        description: "Alphonso pulp, curd, honey, cardamom dust.",
        price: 219,
        art: "shake",
      },
      {
        name: "Filter Coffee Frappe",
        description: "South Indian decoction, jaggery, crushed ice.",
        price: 189,
        art: "shake",
      },
      {
        name: "Brownie Sundae",
        description: "Warm brownie, vanilla scoop, hot fudge.",
        price: 259,
        art: "dessert",
      },
      {
        name: "Peanut Butter Bomb",
        description: "Roasted peanut butter, banana, dark chocolate.",
        price: 249,
        art: "shake",
      },
      {
        name: "Masala Curly Fries",
        description: "Curly fries tossed in chaat masala.",
        price: 149,
        art: "fries",
      },
    ],
  },
  {
    slug: "crispy",
    name: "Crispy Co.",
    description: "Fried chicken, waffle fries and dips worth fighting over.",
    art: "fries",
    km: 1.9,
    bearing: 10,
    area: "Hauz Khas",
    isOpen: false,
    keywords: ["fries", "chicken", "wings", "burger"],
    dishes: [
      {
        name: "Korean Gochujang Wings",
        description: "Double-fried wings, gochujang glaze, sesame.",
        price: 379,
        art: "taco",
      },
      {
        name: "Classic Waffle Fries",
        description: "Crinkle-cut, sea salt, house dip.",
        price: 179,
        art: "fries",
      },
      {
        name: "Nashville Hot Sandwich",
        description: "Cayenne-lacquered chicken, pickles, slaw.",
        price: 349,
        art: "burger",
      },
      {
        name: "Buttermilk Popcorn Chicken",
        description: "Bite-sized, herbed crumb, ranch dip.",
        price: 289,
        art: "fries",
      },
      {
        name: "Cookie Dough Shake",
        description: "Vanilla shake blended with cookie dough chunks.",
        price: 219,
        art: "shake",
      },
      {
        name: "Apple Pie Pockets",
        description: "Flaky pockets with spiced apple filling.",
        price: 149,
        art: "dessert",
      },
    ],
  },
];

const buildRestaurant = (
  blueprint: RestaurantBlueprint,
  origin: Location,
  ownerId: string,
  isVerified: boolean,
  index: number,
): IRestaurant => ({
  _id: `demo-rest-${blueprint.slug}`,
  name: blueprint.name,
  description: blueprint.description,
  image: demoArt(blueprint.art),
  ownerId,
  phone: 9810000000 + index * 111,
  isVerified,
  soundEnabled: false,
  autoLocation: {
    type: "Point",
    coordinates: offset(origin, blueprint.km, blueprint.bearing),
    formattedAddress: `${blueprint.name}, ${blueprint.area}`,
  },
  isOpen: blueprint.isOpen,
  createdAt: new Date(Date.now() - (index + 3) * 86400000),
});

const buildItems = (
  blueprint: RestaurantBlueprint,
  restaurantId: string,
): IMenuItem[] =>
  blueprint.dishes.map((dish, index) => ({
    _id: `demo-item-${blueprint.slug}-${index}`,
    restaurantId,
    name: dish.name,
    description: dish.description,
    price: dish.price,
    image: demoArt(dish.art),
    isAvailable: !dish.soldOut,
    createdAt: new Date(Date.now() - (index + 1) * 3600000),
    updatedAt: new Date(Date.now() - (index + 1) * 3600000),
  }));

const buildRider = (id: string, index: number, verified: boolean): IRider => ({
  _id: id,
  picture: demoArt("rider"),
  phoneNumber: String(9820000000 + index * 1234),
  aadharNumber: String(210987654321 + index * 7),
  drivingLicenseNumber: `DL-04201101${49646 + index}`,
  isVerified: verified,
  soundEnabled: false,
  isAvailable: false,
  lastActiveAt: new Date(Date.now() - 900000).toISOString(),
  createdAt: new Date(Date.now() - (index + 2) * 86400000).toISOString(),
});

const DROP_POINTS = [
  { label: "Flat 402, Aravali Apartments", km: 0.9, bearing: 60, mobile: 9811122334 },
  { label: "B-14, Sarvodaya Enclave", km: 1.7, bearing: 190, mobile: 9822233445 },
  { label: "Tower C, Panchsheel Heights", km: 2.6, bearing: 300, mobile: 9833344556 },
];

const GUEST_NAMES = ["Ira Malhotra", "Dev Sharma", "Nayan Rao", "Kabir Sen"];

export const buildOrder = (params: {
  id: string;
  userId: string;
  restaurant: IRestaurant;
  items: IMenuItem[];
  quantities?: number[];
  status: OrderStatus;
  origin: Location;
  drop: { label: string; km: number; bearing: number; mobile: number };
  minutesAgo: number;
  rider?: { id: string; name: string; phone: number } | null;
}): IOrder => {
  const {
    id,
    userId,
    restaurant,
    items,
    quantities,
    status,
    origin,
    drop,
    minutesAgo,
    rider,
  } = params;

  const orderItems: IOrderItem[] = items.map((item, index) => ({
    itemId: item._id,
    name: item.name,
    quantity: quantities?.[index] ?? 1,
    price: item.price,
  }));
  const subTotal = orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const deliveryFee = getDeliveryFee(subTotal);
  const [dropLng, dropLat] = offset(origin, drop.km, drop.bearing);
  const [restLng, restLat] = restaurant.autoLocation.coordinates;
  const distance = getDistanceKm(restLat, restLng, dropLat, dropLng);
  const createdAt = new Date(Date.now() - minutesAgo * 60000);

  return {
    _id: id,
    userId,
    restaurantId: restaurant._id,
    restaurantName: restaurant.name,
    riderId: rider?.id ?? null,
    riderName: rider?.name ?? null,
    riderPhone: rider?.phone ?? null,
    distance,
    riderAmount: 30 + Math.round(distance * 8),
    items: orderItems,
    subTotal,
    deliveryFee,
    platformFee: PLATFORM_FEE,
    totalAmount: subTotal + deliveryFee + PLATFORM_FEE,
    addressId: `demo-address-${drop.km}`,
    deliveryAddress: {
      formattedAddress: `${drop.label}, ${DEMO_ORIGIN.formattedAddress}`,
      mobile: drop.mobile,
      latitude: dropLat,
      longitude: dropLng,
    },
    status,
    paymentMethod: "razorpay",
    paymentStatus: "paid",
    paymentId: `demo-pay-${id}`,
    createdAt,
    updatedAt: createdAt,
  };
};

export const seedState = (
  role: DemoState["role"],
  seed: DemoSeed,
): DemoState => {
  const origin: Location = seed.origin
    ? {
        latitude: seed.origin.latitude,
        longitude: seed.origin.longitude,
        formattedAddress:
          seed.origin.formattedAddress || DEMO_ORIGIN.formattedAddress,
      }
    : { ...DEMO_ORIGIN };

  const restaurants = BLUEPRINTS.map((blueprint, index) =>
    buildRestaurant(blueprint, origin, seed.userId, true, index),
  );
  const keywords: Record<string, string[]> = {};
  const items: Record<string, IMenuItem[]> = {};
  BLUEPRINTS.forEach((blueprint, index) => {
    const restaurant = restaurants[index];
    keywords[restaurant._id] = blueprint.keywords;
    items[restaurant._id] = buildItems(blueprint, restaurant._id);
  });

  const myRestaurant = restaurants[0];
  const myItems = items[myRestaurant._id];
  const rider = buildRider("demo-rider-me", 0, true);

  const addresses: IAddress[] = DROP_POINTS.map((drop, index) => {
    const [lng, lat] = offset(origin, drop.km, drop.bearing);
    return {
      _id: `demo-address-${drop.km}`,
      userId: seed.userId,
      formattedAddress: `${drop.label}, ${DEMO_ORIGIN.formattedAddress}`,
      mobile: drop.mobile,
      location: { type: "Point", coordinates: [lng, lat] },
      createdAt: new Date(Date.now() - (index + 1) * 86400000),
      updatedAt: new Date(Date.now() - (index + 1) * 86400000),
    };
  });

  const orders: IOrder[] = [
    buildOrder({
      id: "demo-order-history",
      userId: seed.userId,
      restaurant: restaurants[2],
      items: [items[restaurants[2]._id][1], items[restaurants[2]._id][4]],
      quantities: [1, 2],
      status: "delivered",
      origin,
      drop: DROP_POINTS[0],
      minutesAgo: 2880,
      rider: { id: "demo-rider-arjun", name: "Arjun Tiwari", phone: 9845512300 },
    }),
    buildOrder({
      id: "demo-order-live-1",
      userId: "demo-guest-1",
      restaurant: myRestaurant,
      items: [myItems[0], myItems[3]],
      quantities: [2, 1],
      status: "placed",
      origin,
      drop: DROP_POINTS[1],
      minutesAgo: 3,
    }),
    buildOrder({
      id: "demo-order-live-2",
      userId: "demo-guest-2",
      restaurant: myRestaurant,
      items: [myItems[1], myItems[5]],
      status: "preparing",
      origin,
      drop: DROP_POINTS[2],
      minutesAgo: 11,
    }),
    buildOrder({
      id: "demo-order-live-3",
      userId: "demo-guest-3",
      restaurant: myRestaurant,
      items: [myItems[2], myItems[4]],
      quantities: [1, 2],
      status: "ready_for_rider",
      origin,
      drop: DROP_POINTS[0],
      minutesAgo: 18,
    }),
    buildOrder({
      id: "demo-order-live-4",
      userId: "demo-guest-4",
      restaurant: restaurants[1],
      items: [items[restaurants[1]._id][0], items[restaurants[1]._id][4]],
      status: "ready_for_rider",
      origin,
      drop: DROP_POINTS[2],
      minutesAgo: 9,
    }),
    buildOrder({
      id: "demo-order-done-1",
      userId: "demo-guest-1",
      restaurant: myRestaurant,
      items: [myItems[4]],
      quantities: [3],
      status: "delivered",
      origin,
      drop: DROP_POINTS[1],
      minutesAgo: 240,
      rider: { id: "demo-rider-arjun", name: "Arjun Tiwari", phone: 9845512300 },
    }),
    buildOrder({
      id: "demo-order-done-2",
      userId: "demo-guest-2",
      restaurant: myRestaurant,
      items: [myItems[1], myItems[2]],
      status: "delivered",
      origin,
      drop: DROP_POINTS[2],
      minutesAgo: 420,
      rider: { id: "demo-rider-neha", name: "Neha Bisht", phone: 9845588211 },
    }),
    buildOrder({
      id: "demo-order-done-3",
      userId: "demo-guest-3",
      restaurant: myRestaurant,
      items: [myItems[0]],
      quantities: [2],
      status: "cancelled",
      origin,
      drop: DROP_POINTS[0],
      minutesAgo: 600,
    }),
  ];

  return {
    role,
    userId: seed.userId,
    userName: seed.userName,
    origin,
    restaurants,
    keywords,
    items,
    myRestaurantId: myRestaurant._id,
    cart: [],
    addresses,
    orders,
    rider,
    positions: {},
    progress: {},
    schedule: {},
    seq: 1,
  };
};

export const GUEST_POOL = GUEST_NAMES;
export const DROP_POOL = DROP_POINTS;
