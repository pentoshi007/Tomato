import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { createRouteWalker, type LatLng } from "../utils/routePath";

const RED_ROUTE_STYLE = { color: "#E23744", weight: 5, opacity: 0.95 };

const riderIcon = L.divIcon({
  html: '<span style="font-size: 26px; line-height: 38px; display: block; text-align: center;">🛵</span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  className: "rider-map-icon",
});

const deliveryIcon = L.divIcon({
  html: '<span style="font-size: 26px; line-height: 38px; display: block; text-align: center;">🏠</span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  className: "delivery-map-icon",
});

const restaurantIcon = L.divIcon({
  html: '<span style="font-size: 26px; line-height: 38px; display: block; text-align: center;">🍜</span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  className: "restaurant-map-icon",
});

type RoutingMachine = {
  control: (options: {
    waypoints: L.LatLng[];
    lineOptions: { styles: L.PathOptions[] };
    addWaypoints: boolean;
    draggableWaypoints: boolean;
    show: boolean;
    collapsible: boolean;
    containerClassName: string;
    createMarker: () => null;
    router: unknown;
  }) => L.Control;
  osrmv1: (options: { serviceUrl: string }) => unknown;
};

const routing = (L as typeof L & { Routing: RoutingMachine }).Routing;
const mapTileUrl = import.meta.env.VITE_MAP_TILE_URL;
const routingServiceUrl = import.meta.env.VITE_MAP_ROUTING_URL;

const Routing = ({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) => {
  const map = useMap();

  useEffect(() => {
    const control = routing.control({
      waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
      lineOptions: {
        styles: [RED_ROUTE_STYLE],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      show: false,
      collapsible: false,
      containerClassName: "hidden",
      createMarker: () => null,
      router: routing.osrmv1({
        serviceUrl: routingServiceUrl,
      }),
    }).addTo(map);

    return () => {
      map.removeControl(control);
    };
  }, [from, map, to]);

  return null;
};

const FitRoute = ({ points }: { points: LatLng[] }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(
      L.latLngBounds(points.map((point) => L.latLng(point[0], point[1]))),
      { padding: [28, 28] },
    );
  }, [map, points]);

  return null;
};

const AnimatedRider = ({
  path,
  startedAt,
  durationMs,
  correction,
}: {
  path: LatLng[];
  startedAt: number;
  durationMs: number;
  correction: LatLng | null;
}) => {
  const [position, setPosition] = useState<LatLng>(path[0] ?? [0, 0]);
  const schedule = useRef({ startedAt, durationMs });
  const walker = useMemo(() => createRouteWalker(path), [path]);
  const lastCorrection = useRef<LatLng | null>(null);

  useEffect(() => {
    schedule.current = { startedAt, durationMs };
  }, [startedAt, durationMs]);

  useEffect(() => {
    if (!walker || !correction) return;
    if (
      lastCorrection.current &&
      lastCorrection.current[0] === correction[0] &&
      lastCorrection.current[1] === correction[1]
    ) {
      return;
    }
    lastCorrection.current = correction;
    const fraction = walker.fractionNear(correction);
    const { durationMs: total } = schedule.current;
    const impliedStart = Date.now() - fraction * total;
    if (Math.abs(impliedStart - schedule.current.startedAt) > 3000) {
      schedule.current = { startedAt: impliedStart, durationMs: total };
    }
  }, [correction, walker]);

  useEffect(() => {
    if (!walker) return;
    let frame = 0;
    let lastDrawn: LatLng | null = null;
    const step = () => {
      const { startedAt: start, durationMs: total } = schedule.current;
      const fraction = Math.min(1, Math.max(0, (Date.now() - start) / total));
      const point = walker.pointAt(fraction);
      if (
        !lastDrawn ||
        Math.abs(lastDrawn[0] - point[0]) > 0.00002 ||
        Math.abs(lastDrawn[1] - point[1]) > 0.00002
      ) {
        lastDrawn = point;
        setPosition(point);
      }
      if (fraction < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [walker]);

  if (!walker) return null;
  return (
    <Marker position={position} icon={riderIcon}>
      <Popup>Your rider is here</Popup>
    </Marker>
  );
};

export type LiveRoute = {
  phase: "pickup" | "delivery";
  path: LatLng[];
  startedAt: number;
  durationMs: number;
};

interface Props {
  riderLocation: [number, number] | null;
  deliveryLocation: [number, number] | null;
  route: LiveRoute | null;
  restaurantName: string;
}

const UserOrderMap = ({
  riderLocation,
  deliveryLocation,
  route,
  restaurantName,
}: Props) => {
  if (!deliveryLocation) {
    return null;
  }

  // MapContainer only reads `center` when it creates the map, so anchor on
  // the delivery address; the route bounds refit the view once a route
  // arrives.
  const mapCenter = deliveryLocation;
  const restaurantPosition = route
    ? route.phase === "pickup"
      ? route.path[route.path.length - 1] ?? null
      : route.path[0] ?? null
    : null;
  const fitPoints = route ? [...route.path, deliveryLocation] : [];
  const locationStatus = riderLocation || route ? "Live" : "Locating rider...";

  return (
    <section className="mt-6">
      <div className="card overflow-hidden p-2">
        <div className="flex items-center justify-between gap-4 px-3 pb-3 pt-2 sm:px-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-smoke uppercase">
              Live delivery
            </p>
            <h2 className="font-display mt-1 text-xl font-extrabold tracking-tight">
              Track your order
            </h2>
          </div>
          <span className={`chip ${riderLocation || route ? "bg-mint" : "bg-butter"}`}>
            <span
              className={`h-2 w-2 rounded-full border border-ink ${
                riderLocation || route ? "bg-basil" : "bg-mustard"
              }`}
            />
            {locationStatus}
          </span>
        </div>

        <div className="relative">
          <MapContainer
            center={mapCenter}
            zoom={14}
            scrollWheelZoom
            className="h-[320px] w-full rounded-xl sm:h-[420px]"
          >
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url={mapTileUrl}
            />
            <Marker position={deliveryLocation} icon={deliveryIcon}>
              <Popup>Delivery location</Popup>
            </Marker>
            {route ? (
              <>
                <Polyline
                  positions={route.path}
                  pathOptions={RED_ROUTE_STYLE}
                />
                {restaurantPosition && (
                  <Marker position={restaurantPosition} icon={restaurantIcon}>
                    <Popup>{restaurantName}</Popup>
                  </Marker>
                )}
                <AnimatedRider
                  path={route.path}
                  startedAt={route.startedAt}
                  durationMs={route.durationMs}
                  correction={riderLocation}
                />
                <FitRoute points={fitPoints} />
              </>
            ) : (
              <>
                {riderLocation && (
                  <Marker position={riderLocation} icon={riderIcon}>
                    <Popup>Your rider is here</Popup>
                  </Marker>
                )}
                {riderLocation && (
                  <Routing from={riderLocation} to={deliveryLocation} />
                )}
              </>
            )}
          </MapContainer>
          {!riderLocation && !route && (
            <div className="pointer-events-none absolute bottom-4 left-4 z-[500] max-w-xs rounded-xl border-2 border-ink bg-paper px-3 py-2 text-xs font-bold shadow-pop-xs">
              Waiting for rider location...
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UserOrderMap;
