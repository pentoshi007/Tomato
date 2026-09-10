import axios from "axios";

export type FoodPoi = {
  name: string;
  latitude: number;
  longitude: number;
  housenumber: string | null;
  street: string | null;
  suburb: string | null;
  city: string | null;
  postcode: string | null;
};

const OVERPASS_TIMEOUT_MS = 7000;
const FOOD_AMENITIES = "restaurant|fast_food|cafe|food_court";
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const firstSuccess = <T>(tasks: Promise<T>[]): Promise<T | null> =>
  new Promise((resolve) => {
    let pending = tasks.length;
    let settled = false;
    const finish = (value: T | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    for (const task of tasks) {
      void task.then(
        (value) => finish(value),
        () => {
          pending -= 1;
          if (pending === 0) finish(null);
        },
      );
    }
  });

const tagValue = (tags: Record<string, unknown>, key: string) => {
  const value = tags[key];
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : null;
};

export const fetchFoodPois = async (
  latitude: number,
  longitude: number,
  radiusKm: number,
): Promise<FoodPoi[]> => {
  const query =
    `[out:json][timeout:10];` +
    `(nwr["name"]["amenity"~"^(${FOOD_AMENITIES})$"]` +
    `(around:${Math.round(radiusKm * 1000)},${latitude},${longitude}););` +
    `out tags center 400;`;
  const endpoints = process.env.OVERPASS_URL
    ? [process.env.OVERPASS_URL]
    : OVERPASS_ENDPOINTS;
  const request = (endpoint: string) =>
    axios
      .post(endpoint, `data=${encodeURIComponent(query)}`, {
        timeout: OVERPASS_TIMEOUT_MS,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "TomatoDemoSeeder/1.0",
        },
      })
      .then((response) => response.data as unknown)
      .catch((error) => {
        console.log(`overpass endpoint failed: ${endpoint}`, error?.code ?? error?.response?.status);
        throw error;
      });
  let data: unknown = null;
  try {
    data = await firstSuccess(endpoints.map((endpoint) => request(endpoint)));
  } catch {
    return [];
  }
  const elements = ((data as { elements?: unknown[] } | null)?.elements ??
    []) as unknown[];
  const pois: FoodPoi[] = [];
  for (const element of elements) {
    if (typeof element !== "object" || element === null) continue;
    const record = element as Record<string, unknown>;
    const tags = (record.tags ?? {}) as Record<string, unknown>;
    const name = tagValue(tags, "name");
    const center = (record.center ?? null) as
      | { lat?: unknown; lon?: unknown }
      | null;
    const poiLatitude = typeof record.lat === "number" ? record.lat : center?.lat;
    const poiLongitude = typeof record.lon === "number" ? record.lon : center?.lon;
    if (!name || typeof poiLatitude !== "number" || typeof poiLongitude !== "number") {
      continue;
    }
    pois.push({
      name,
      latitude: poiLatitude,
      longitude: poiLongitude,
      housenumber: tagValue(tags, "addr:housenumber"),
      street: tagValue(tags, "addr:street"),
      suburb:
        tagValue(tags, "addr:suburb") ??
        tagValue(tags, "addr:neighbourhood") ??
        tagValue(tags, "addr:quarter"),
      city:
        tagValue(tags, "addr:city") ??
        tagValue(tags, "addr:town") ??
        tagValue(tags, "addr:village"),
      postcode: tagValue(tags, "addr:postcode"),
    });
  }
  return pois;
};
