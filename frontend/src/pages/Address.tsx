import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { restaurantService, utilsService } from "../config";
import L from "leaflet";
import {
  LuLocateFixed,
  LuMapPin,
  LuPhone,
  LuTrash2,
  LuLoaderCircle,
  LuCircleCheck,
  LuInfo,
} from "react-icons/lu";
import { BiArrowBack } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "../components/ui/primitives";

const mapTileUrl = import.meta.env.VITE_MAP_TILE_URL;
const openStreetMapCopyrightUrl = import.meta.env.VITE_OPENSTREETMAP_COPYRIGHT_URL;

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: import.meta.env.VITE_LEAFLET_ICON_RETINA_URL,
  iconUrl: import.meta.env.VITE_LEAFLET_ICON_URL,
  shadowUrl: import.meta.env.VITE_LEAFLET_ICON_SHADOW_URL,
});

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

// ── Sub-components (must live inside MapContainer) ──

const LocationPicker = ({
  setLocation,
}: {
  setLocation: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      setLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const LocateMeButton = ({
  onLocate,
  locating,
  setLocating,
}: {
  onLocate: (lat: number, lng: number) => void;
  locating: boolean;
  setLocating: (v: boolean) => void;
}) => {
  const map = useMap();

  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, { animate: true });
        onLocate(latitude, longitude);
        setLocating(false);
      },
      () => {
        toast.error("Location permission denied");
        setLocating(false);
      },
    );
  };

  return (
    <button
      onClick={locateUser}
      disabled={locating}
      aria-label="Use my current location"
      title="Use my current location"
      style={{ zIndex: 1000, position: "absolute", top: "12px", right: "12px" }}
      className="btn-secondary !py-1.5 !text-xs"
    >
      {locating ? (
        <LuLoaderCircle size={14} className="animate-spin text-tomato" />
      ) : (
        <LuLocateFixed size={14} className="text-tomato" />
      )}
      {locating ? "Locating…" : "Use current location"}
    </button>
  );
};

// ── Main page ──

const AddAddressPage = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const statusRef = useRef<HTMLDivElement>(null);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reverse geocoding (debounced 600 ms, with AbortController)
  const fetchFormattedAddress = useCallback((lat: number, lng: number) => {
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    setGeocoding(true);
    setFormattedAddress("");

    geocodeTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const { data } = await axios.get(`${utilsService}/api/geocode/reverse`, {
          params: { lat, lon: lng },
          signal: controller.signal,
        });
        setFormattedAddress(data.display_name || "");
      } catch (err: unknown) {
        if (
          (err instanceof Error && err.name === "AbortError") ||
          axios.isCancel(err)
        ) {
          return; // superseded by newer click
        }
        console.warn("Geocoding failed:", err);
        setFormattedAddress("");
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setGeocoding(false);
        }
      }
    }, 600);
  }, []);

  useEffect(() => {
    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const setLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    fetchFormattedAddress(lat, lng);
  };

  const validateMobile = (value: string) => {
    if (!value) return "Mobile number is required";
    if (!/^\d{10,15}$/.test(value)) return "Enter a valid 10–15 digit number";
    return "";
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setMobile(val);
    setMobileError(validateMobile(val));
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/address/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
    } catch {
      toast.error("Failed to load saved addresses");
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const addAddress = async () => {
    const phoneErr = validateMobile(mobile);
    if (phoneErr) {
      setMobileError(phoneErr);
      toast.error(phoneErr);
      return;
    }
    if (latitude === null || longitude === null) {
      toast.error("Please pin your location on the map");
      return;
    }
    if (!formattedAddress.trim()) {
      toast.error("Please enter or confirm your address");
      return;
    }

    try {
      setAdding(true);
      await axios.post(
        `${restaurantService}/api/address/add`,
        {
          formattedAddress: formattedAddress.trim(),
          mobile: Number(mobile),
          latitude,
          longitude,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Address saved");
      setMobile("");
      setMobileError("");
      setFormattedAddress("");
      setLatitude(null);
      setLongitude(null);
      fetchAddresses();
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(
        typeof message === "string" ? message : "Failed to save address",
      );
    } finally {
      setAdding(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!window.confirm("Remove this address?")) return;
    try {
      setDeletingId(id);
      await axios.delete(`${restaurantService}/api/address/delete/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Address removed");
      fetchAddresses();
    } catch {
      toast.error("Failed to remove address");
    } finally {
      setDeletingId(null);
    }
  };

  const locationPinned = latitude !== null && longitude !== null;
  const canSave =
    locationPinned && !geocoding && !!formattedAddress && !!mobile && !mobileError;

  const steps = [
    { id: 1, label: "Pin location", done: locationPinned },
    { id: 2, label: "Confirm address", done: !!formattedAddress && !geocoding },
    { id: 3, label: "Add mobile", done: !!mobile && !mobileError },
  ];

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary !rounded-full !p-2"
          aria-label="Go back"
        >
          <BiArrowBack className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Drop the pin
          </h1>
          <p className="text-sm font-medium text-smoke">
            Tell us exactly where the food should land.
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <ol aria-label="Steps to add an address" className="flex flex-wrap items-center gap-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`chip transition-colors ${
              step.done ? "bg-mint" : "bg-paper text-smoke"
            }`}
          >
            {step.done ? (
              <LuCircleCheck size={13} className="shrink-0 text-basil" />
            ) : (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-black text-cream">
                {step.id}
              </span>
            )}
            {step.label}
          </li>
        ))}
      </ol>

      {/* Map */}
      <section aria-labelledby="map-heading">
        <h2 id="map-heading" className="sr-only">
          Location map
        </h2>
        <div className="mb-3 flex items-center gap-2 rounded-xl border-2 border-ink bg-skywash px-3 py-2 text-xs font-bold">
          <LuInfo size={14} className="shrink-0 text-sky" />
          Tap anywhere on the map to pin your spot, or auto-detect.
        </div>

        <div
          className="relative h-[340px] overflow-hidden rounded-2xl border-2 border-ink shadow-pop sm:h-[380px]"
          style={{ cursor: "crosshair" }}
          role="application"
          aria-label="Interactive delivery location map. Click to select a location."
        >
          <MapContainer
            center={[latitude ?? 28.5468576, longitude ?? 77.1786905]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              url={mapTileUrl}
              attribution={`&copy; <a href="${openStreetMapCopyrightUrl}">OpenStreetMap</a>`}
            />
            <LocationPicker setLocation={setLocation} />
            <LocateMeButton
              onLocate={setLocation}
              locating={locating}
              setLocating={setLocating}
            />
            {locationPinned && <Marker position={[latitude, longitude]} />}
          </MapContainer>
        </div>
      </section>

      {/* Address preview / edit */}
      <section aria-labelledby="address-label" aria-live="polite" ref={statusRef}>
        <label id="address-label" htmlFor="formatted-address" className="label">
          Delivery address
        </label>

        {geocoding ? (
          <div
            role="status"
            aria-live="polite"
            className="card-flat flex items-center gap-3 px-4 py-3 text-sm font-medium text-smoke"
          >
            <LuLoaderCircle size={16} className="animate-spin text-tomato" />
            Fetching address details…
          </div>
        ) : (
          <div className="relative">
            <LuMapPin
              size={16}
              className="pointer-events-none absolute top-3.5 left-3.5 text-tomato"
            />
            <textarea
              id="formatted-address"
              value={formattedAddress}
              onChange={(e) => setFormattedAddress(e.target.value)}
              placeholder={
                locationPinned
                  ? "Loading address…"
                  : "Pin a location on the map above"
              }
              rows={2}
              aria-describedby="address-hint"
              className="input resize-none !pl-10"
            />
          </div>
        )}
        <p id="address-hint" className="mt-1.5 text-xs font-medium text-smoke">
          You can edit this address if it's not precise enough.
        </p>
      </section>

      {/* Mobile input */}
      <section>
        <label htmlFor="mobile-number" className="label">
          Mobile number
        </label>
        <div className="relative">
          <LuPhone
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-smoke"
          />
          <input
            id="mobile-number"
            type="tel"
            inputMode="numeric"
            placeholder="e.g. 9876543210"
            value={mobile}
            onChange={handleMobileChange}
            aria-invalid={!!mobileError}
            aria-describedby={mobileError ? "mobile-error" : undefined}
            maxLength={15}
            className={`input !pl-10 ${mobileError ? "!border-tomato" : ""}`}
          />
        </div>
        {mobileError && (
          <p id="mobile-error" role="alert" className="mt-1.5 text-xs font-bold text-tomato">
            {mobileError}
          </p>
        )}
      </section>

      <button
        disabled={adding || !canSave}
        onClick={addAddress}
        aria-label={adding ? "Saving address…" : "Save this delivery address"}
        className="btn-primary w-full !py-3"
      >
        {adding ? (
          <>
            <LuLoaderCircle size={16} className="animate-spin" /> Saving…
          </>
        ) : (
          "Save address"
        )}
      </button>

      {/* Saved addresses */}
      <section aria-labelledby="saved-heading" className="space-y-3 pb-4">
        <h2 id="saved-heading" className="font-display text-xl font-extrabold tracking-tight">
          Saved addresses
        </h2>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="card-flat border-dashed px-6 py-10 text-center">
            <LuMapPin size={30} className="mx-auto mb-2 text-tomato" />
            <p className="text-sm font-bold">No addresses saved yet</p>
            <p className="mt-1 text-xs font-medium text-smoke">
              Pin a location above and save it to see it here.
            </p>
          </div>
        ) : (
          <ul role="list" className="space-y-3">
            {addresses.map((addr) => (
              <li
                key={addr._id}
                className="card-flat flex items-start justify-between gap-4 p-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-blush"
                    aria-hidden="true"
                  >
                    <LuMapPin size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {addr.formattedAddress}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-smoke">
                      <LuPhone size={11} />
                      {addr.mobile}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => deleteAddress(addr._id)}
                  disabled={deletingId === addr._id}
                  aria-label={`Delete address: ${addr.formattedAddress}`}
                  className="btn-danger-ghost !rounded-lg !p-2"
                >
                  {deletingId === addr._id ? (
                    <LuLoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <LuTrash2 size={15} />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default AddAddressPage;
