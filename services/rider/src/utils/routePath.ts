import axios from "axios";

export type LatLng = [number, number];

const ROUTE_TIMEOUT_MS = 5000;
const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

const segmentKm = (from: LatLng, to: LatLng) => {
  const dLat = toRad(to[0] - from[0]);
  const dLon = toRad(to[1] - from[1]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from[0])) *
      Math.cos(toRad(to[0])) *
      Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
};

export type RouteWalker = {
  path: LatLng[];
  totalKm: number;
  pointAt: (fraction: number) => LatLng;
  fractionNear: (point: LatLng) => number;
};

export const createRouteWalker = (path: LatLng[]): RouteWalker | null => {
  const [firstPoint] = path;
  if (!firstPoint || path.length < 2) return null;

  const cumulative: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    if (!from || !to) return null;
    cumulative.push((cumulative[i - 1] ?? 0) + segmentKm(from, to));
  }
  const totalKm = cumulative[cumulative.length - 1] ?? 0;

  const pointAt = (fraction: number): LatLng => {
    const target = Math.min(1, Math.max(0, fraction)) * totalKm;
    let index = 1;
    while (index < cumulative.length - 1 && (cumulative[index] ?? 0) < target) {
      index++;
    }
    const from = path[index - 1];
    const to = path[index];
    if (!from || !to) return firstPoint;
    const segment = (cumulative[index] ?? 0) - (cumulative[index - 1] ?? 0);
    const ratio = segment > 0 ? (target - (cumulative[index - 1] ?? 0)) / segment : 1;
    return [
      from[0] + (to[0] - from[0]) * ratio,
      from[1] + (to[1] - from[1]) * ratio,
    ];
  };

  const fractionNear = (point: LatLng): number => {
    if (totalKm <= 0) return 0;
    let bestDistance = Infinity;
    let bestIndex = 0;
    for (let i = 0; i < path.length; i++) {
      const vertex = path[i];
      if (!vertex) continue;
      const distance = segmentKm(point, vertex);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    return (cumulative[bestIndex] ?? 0) / totalKm;
  };

  return { path, totalKm, pointAt, fractionNear };
};

export type DrivingRoute = { path: LatLng[]; distanceKm: number };

export const fetchDrivingRoute = async (
  from: LatLng,
  to: LatLng,
): Promise<DrivingRoute | null> => {
  try {
    const base =
      process.env.OSRM_ROUTING_URL ??
      "https://router.project-osrm.org/route/v1";
    const { data } = await axios.get(
      `${base}/driving/${from[1]},${from[0]};${to[1]},${to[0]}`,
      {
        params: { overview: "full", geometries: "geojson" },
        timeout: ROUTE_TIMEOUT_MS,
      },
    );
    const route = (data?.routes ?? [])[0] as
      | { geometry?: { coordinates?: unknown } }
      | undefined;
    const coordinates = route?.geometry?.coordinates;
    if (!Array.isArray(coordinates)) return null;
    const path: LatLng[] = [];
    for (const coordinate of coordinates) {
      if (!Array.isArray(coordinate) || coordinate.length < 2) continue;
      const latitude = Number(coordinate[1]);
      const longitude = Number(coordinate[0]);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        path.push([latitude, longitude]);
      }
    }
    const walker = createRouteWalker(path);
    if (!walker) return null;
    // OSRM snaps endpoints to the nearest road; keep the exact door positions
    // so the rider starts at its true position and reaches the actual marker.
    if (segmentKm(path[0]!, from) * 1000 > 1) path.unshift(from);
    if (segmentKm(path[path.length - 1]!, to) * 1000 > 1) path.push(to);
    return { path, distanceKm: walker.totalKm };
  } catch {
    return null;
  }
};
