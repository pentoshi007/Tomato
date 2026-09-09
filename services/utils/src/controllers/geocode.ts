import type { Request, Response } from "express";

const CACHE_TTL_MS = 5 * 60 * 1000;
const MIN_REQUEST_INTERVAL_MS = 1_100;

type CacheEntry = {
  data: unknown;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();
let nextRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

class NominatimError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "NominatimError";
  }
}

const getCoordinate = (value: unknown): number | null => {
  if (typeof value !== "string" || value.trim() === "") return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

const getCacheKey = (latitude: number, longitude: number) =>
  `${latitude.toFixed(5)},${longitude.toFixed(5)}`;

const getCached = (key: string): unknown | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const reverseGeocode = (latitude: number, longitude: number): Promise<unknown> => {
  const key = getCacheKey(latitude, longitude);
  const cached = getCached(key);
  if (cached !== null) return Promise.resolve(cached);

  const currentRequest = inFlight.get(key);
  if (currentRequest) return currentRequest;

  const request = requestQueue.then(async () => {
    // Another request may have populated the cache while this one was queued.
    const queuedCache = getCached(key);
    if (queuedCache !== null) return queuedCache;

    const waitTime = Math.max(0, nextRequestAt - Date.now());
    if (waitTime > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, waitTime));
    }
    nextRequestAt = Date.now() + MIN_REQUEST_INTERVAL_MS;

    const url = new URL(
      process.env.NOMINATIM_URL ??
        "https://nominatim.openstreetmap.org/reverse",
    );
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("accept-language", "en");
    if (process.env.NOMINATIM_EMAIL) {
      url.searchParams.set("email", process.env.NOMINATIM_EMAIL);
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent":
          process.env.NOMINATIM_USER_AGENT ?? "TomatoDeliveryApp/1.0",
      },
    });

    if (!response.ok) {
      throw new NominatimError(
        response.status,
        `Nominatim responded with ${response.status}`,
      );
    }

    const data: unknown = await response.json();
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  });

  // Keep the queue usable after a failed upstream request.
  requestQueue = request.then(
    () => undefined,
    () => undefined,
  );
  inFlight.set(key, request);
  void request.then(
    () => inFlight.delete(key),
    () => inFlight.delete(key),
  );

  return request;
};

export const reverseGeocodeHandler = async (req: Request, res: Response) => {
  const latitude = getCoordinate(req.query.lat);
  const longitude = getCoordinate(req.query.lon);

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return res
      .status(400)
      .json({ message: "Valid latitude and longitude are required" });
  }

  try {
    const data = await reverseGeocode(latitude, longitude);
    return res.status(200).json(data);
  } catch (error) {
    if (error instanceof NominatimError) {
      return res.status(error.status === 429 ? 429 : 502).json({
        message: "Reverse geocoding provider is temporarily unavailable",
      });
    }

    console.error("Reverse geocoding failed:", error);
    return res
      .status(502)
      .json({ message: "Reverse geocoding provider is temporarily unavailable" });
  }
};
