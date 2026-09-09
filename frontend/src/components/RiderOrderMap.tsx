import axios from "axios";
import { useEffect, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { IOrder } from "../types";
import { realtimeService } from "../config";

const riderIcon = L.divIcon({
  html: '<span style="font-size: 26px; line-height: 38px; display: block; text-align: center;">🛵</span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  className: "rider-map-icon",
});

const deliveryIcon = L.divIcon({
  html: '<span style="font-size: 26px; line-height: 38px; display: block; text-align: center;">📦</span>',
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
  currentOrder: IOrder;
}

interface LocationState {
  key: string;
  coordinates: [number, number] | null;
  error: string | null;
}

const RiderOrderMap = ({ currentOrder }: Props) => {
  const [locationState, setLocationState] = useState<LocationState>({
    key: "",
    coordinates: null,
    error: null,
  });
  const { latitude, longitude } = currentOrder.deliveryAddress;
  const { userId } = currentOrder;
  const hasDeliveryLocation =
    Number.isFinite(latitude) && Number.isFinite(longitude);
  const deliveryLocation: [number, number] | null = hasDeliveryLocation
    ? [latitude, longitude]
    : null;
  const deliveryLocationKey = `${userId}:${latitude}:${longitude}`;
  const canUseGeolocation =
    typeof navigator !== "undefined" && "geolocation" in navigator;
  const hasCurrentLocation = locationState.key === deliveryLocationKey;
  const riderLocation = hasCurrentLocation
    ? locationState.coordinates
    : null;
  const locationError = hasCurrentLocation
    ? locationState.error
    : canUseGeolocation
      ? null
      : "Location access is not available on this device.";

  useEffect(() => {
    let isActive = true;

    if (!hasDeliveryLocation || !canUseGeolocation) {
      return () => {
        isActive = false;
      };
    }

    const fetchLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isActive) return;

          const nextLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setLocationState({
            key: deliveryLocationKey,
            coordinates: nextLocation,
            error: null,
          });

          void axios
            .post(
              `${realtimeService}/api/internal/emit`,
              {
                event: "rider:location",
                room: `user:${userId}`,
                payload: {
                  orderId: currentOrder._id,
                  latitude: nextLocation[0],
                  longitude: nextLocation[1],
                },
              },
              {
                headers: {
                  "x-internal-key": import.meta.env.VITE_INTERNAL_SERVICE_KEY,
                },
              },
            )
            .catch((error: unknown) => {
              console.error("Unable to share rider location", error);
            });
        },
        (error) => {
          if (!isActive) return;

          console.error("Location error", error);
          setLocationState({
            key: deliveryLocationKey,
            coordinates: null,
            error: "Allow location access to see your live route.",
          });
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        },
      );
    };

    fetchLocation();
    const interval = window.setInterval(fetchLocation, 10000);

    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, [
    canUseGeolocation,
    currentOrder._id,
    deliveryLocationKey,
    hasDeliveryLocation,
    latitude,
    longitude,
    userId,
  ]);

  if (!deliveryLocation) {
    return null;
  }

  const mapCenter = riderLocation ?? deliveryLocation;
  const locationStatus = riderLocation
    ? "Live"
    : locationError
      ? "Location pending"
      : "Locating...";

  return (
    <section className="mt-6">
      <div className="card overflow-hidden p-2">
        <div className="flex items-center justify-between gap-4 px-3 pb-3 pt-2 sm:px-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-smoke uppercase">
              Live delivery
            </p>
            <h2 className="font-display mt-1 text-xl font-extrabold tracking-tight">
              Your route
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
                <Popup>You are here</Popup>
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
              {locationError ?? "Getting your live location..."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RiderOrderMap;
