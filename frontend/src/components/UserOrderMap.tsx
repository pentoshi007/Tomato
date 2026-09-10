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
        styles: [{ color: "#E23744", weight: 5, opacity: 0.95 }],
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
          <span className={`chip ${riderLocation ? "bg-mint" : "bg-butter"}`}>
            <span
              className={`h-2 w-2 rounded-full border border-ink ${
                riderLocation ? "bg-basil" : "bg-mustard"
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
