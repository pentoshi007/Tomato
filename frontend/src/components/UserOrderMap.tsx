import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

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
        styles: [{ color: "#E23774", weight: 5, opacity: 0.9 }],
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

interface Props {
  riderLocation: [number, number] | null;
  deliveryLocation: [number, number] | null;
}

const UserOrderMap = ({ riderLocation, deliveryLocation }: Props) => {
  if (!deliveryLocation) {
    return null;
  }

  // MapContainer only reads `center` when it creates the map, so anchor on
  // the delivery address; the routing control re-frames the view to fit the
  // route once the rider's live position arrives.
  const mapCenter = deliveryLocation;
  const locationStatus = riderLocation ? "Live" : "Locating rider...";

  return (
    <section className="mx-auto mt-6 w-full max-w-6xl px-4 pb-6">
      <div className="overflow-hidden rounded-[28px] border border-[#f7d0dc] bg-white p-2 shadow-sm">
        <div className="flex items-center justify-between gap-4 px-3 pb-3 pt-2 sm:px-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Live delivery
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900">
              Track your order
            </h2>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
              riderLocation
                ? "bg-[#fff7fa] text-[#E23774] ring-[#f7d0dc]"
                : "bg-gray-50 text-gray-600 ring-gray-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                riderLocation ? "bg-[#E23774]" : "bg-gray-400"
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
            className="h-[420px] w-full rounded-2xl"
          >
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url={mapTileUrl}
            />
            {riderLocation && (
              <Marker position={riderLocation} icon={riderIcon}>
                <Popup>Your rider is here</Popup>
              </Marker>
            )}
            <Marker position={deliveryLocation} icon={deliveryIcon}>
              <Popup>Delivery location</Popup>
            </Marker>
            {riderLocation && (
              <Routing from={riderLocation} to={deliveryLocation} />
            )}
          </MapContainer>
          {!riderLocation && (
            <div className="pointer-events-none absolute bottom-4 left-4 max-w-xs rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
              Waiting for rider location...
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UserOrderMap;
