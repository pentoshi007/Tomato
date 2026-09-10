export const destinationPoint = (
  latitude: number,
  longitude: number,
  bearingDeg: number,
  distanceKm: number,
) => {
  const radius = 6371;
  const bearing = (bearingDeg * Math.PI) / 180;
  const lat1 = (latitude * Math.PI) / 180;
  const lng1 = (longitude * Math.PI) / 180;
  const angular = distanceKm / radius;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );
  return {
    latitude: +((lat2 * 180) / Math.PI).toFixed(6),
    longitude: +(((((lng2 * 180) / Math.PI + 540) % 360) - 180).toFixed(6)),
  };
};
