export type LatLng = [number, number];

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

const segmentKm = (from: LatLng, to: LatLng) => {
  const dLat = toRad(to[0] - from[0]);
  const dLon = toRad(to[1] - from[1]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from[0])) * Math.cos(toRad(to[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
};

export const bearingDeg = (from: LatLng, to: LatLng): number | null => {
  if (from[0] === to[0] && from[1] === to[1]) return null;
  const latFrom = toRad(from[0]);
  const latTo = toRad(to[0]);
  const dLon = toRad(to[1] - from[1]);
  const y = Math.sin(dLon) * Math.cos(latTo);
  const x =
    Math.cos(latFrom) * Math.sin(latTo) -
    Math.sin(latFrom) * Math.cos(latTo) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180) / Math.PI;
};

export type RouteWalker = {
  path: LatLng[];
  totalKm: number;
  pointAt: (fraction: number) => LatLng;
  remainingPath: (fraction: number) => LatLng[];
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

  const locate = (fraction: number) => {
    const target = Math.min(1, Math.max(0, fraction)) * totalKm;
    let index = 1;
    while (index < cumulative.length - 1 && (cumulative[index] ?? 0) < target) {
      index++;
    }
    const from = cumulative[index - 1] ?? 0;
    const to = cumulative[index] ?? 0;
    const segment = to - from;
    return { index, ratio: segment > 0 ? (target - from) / segment : 1 };
  };

  const pointAt = (fraction: number): LatLng => {
    const { index, ratio } = locate(fraction);
    const from = path[index - 1];
    const to = path[index];
    if (!from || !to) return firstPoint;
    return [
      from[0] + (to[0] - from[0]) * ratio,
      from[1] + (to[1] - from[1]) * ratio,
    ];
  };

  const remainingPath = (fraction: number): LatLng[] => {
    if (fraction >= 1) return [];
    const { index } = locate(fraction);
    return [pointAt(fraction), ...path.slice(index)];
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

  return { path, totalKm, pointAt, remainingPath, fractionNear };
};
