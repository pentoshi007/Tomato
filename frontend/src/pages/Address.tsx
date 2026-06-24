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
import { restaurantService } from "../App";
import L from "leaflet";
import { LuLocateFixed, LuMapPin, LuPhone, LuTrash2, LuLoaderCircle, LuPlus, LuCircleCheck, LuInfo } from "react-icons/lu";

// 🔧 Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

// ──────────────────────────────────────────────
// Sub-components (must live inside MapContainer)
// ──────────────────────────────────────────────

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
      className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-md ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E23744] disabled:opacity-60"
    >
      {locating ? (
        <LuLoaderCircle size={15} className="animate-spin text-[#E23744]" />
      ) : (
        <LuLocateFixed size={15} className="text-[#E23744]" />
      )}
      {locating ? "Locating…" : "Use current location"}
    </button>
  );
};

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────

const AddAddressPage = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Form state
  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const mobileInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Reverse geocoding (debounced 600 ms, with AbortController) ──────────
  const fetchFormattedAddress = useCallback((lat: number, lng: number) => {
    // Cancel any pending debounce
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    // Cancel any in-flight request
    if (abortControllerRef.current) abortControllerRef.current.abort();

    setGeocoding(true);
    setFormattedAddress("");

    geocodeTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`,
          {
            signal: controller.signal,
            headers: {
              // Nominatim usage policy requires a descriptive User-Agent
              "User-Agent": "TomatoDeliveryApp/1.0 (local-dev)",
            },
          },
        );
        if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
        const data = await res.json();
        setFormattedAddress(data.display_name || "");
      } catch (err: any) {
        if (err?.name === "AbortError") return; // superseded by newer click
        console.warn("Geocoding failed:", err);
        // Don't toast — let user type address manually instead
        setFormattedAddress("");
      } finally {
        setGeocoding(false);
      }
    }, 600);
  }, []);

  // Cleanup on unmount
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

  // ── Phone validation ──────────────────────────
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

  // ── Fetch saved addresses ─────────────────────
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

  // ── Add address ───────────────────────────────
  const addAddress = async () => {
    const phoneErr = validateMobile(mobile);
    if (phoneErr) {
      setMobileError(phoneErr);
      mobileInputRef.current?.focus();
      return;
    }
    if (!formattedAddress || latitude === null || longitude === null) {
      toast.error("Please pin a location on the map first");
      return;
    }
    try {
      setAdding(true);
      await axios.post(
        `${restaurantService}/api/address/new`,
        { formattedAddress, mobile, latitude, longitude },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      );
      toast.success("Address saved successfully!");
      setMobile("");
      setFormattedAddress("");
      setLatitude(null);
      setLongitude(null);
      setMobileError("");
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save address");
    } finally {
      setAdding(false);
    }
  };

  // ── Delete address ────────────────────────────
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

  // ── Derived state ─────────────────────────────
  const locationPinned = latitude !== null && longitude !== null;
  const canSave = locationPinned && !geocoding && !!formattedAddress && !!mobile && !mobileError;

  // ── Steps guide ───────────────────────────────
  const steps = [
    { id: 1, label: "Pin location on map", done: locationPinned },
    { id: 2, label: "Confirm address text", done: !!formattedAddress && !geocoding },
    { id: 3, label: "Enter mobile number", done: !!mobile && !mobileError },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery Address</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pin your location on the map and save it for future orders.
        </p>
      </div>

      {/* ── Step indicators ── */}
      <ol
        aria-label="Steps to add an address"
        className="flex items-center gap-3 flex-wrap"
      >
        {steps.map((step) => (
          <li
            key={step.id}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              step.done
                ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {step.done ? (
              <LuCircleCheck size={13} className="shrink-0" />
            ) : (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-300 text-[10px] text-white font-bold">
                {step.id}
              </span>
            )}
            {step.label}
          </li>
        ))}
      </ol>

      {/* ── Map section ── */}
      <section aria-labelledby="map-heading">
        <h2 id="map-heading" className="sr-only">
          Location Map
        </h2>

        {/* Hint banner */}
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 ring-1 ring-blue-100">
          <LuInfo size={14} className="shrink-0" />
          Click anywhere on the map to pin your delivery location, or use the button to auto-detect.
        </div>

        <div
          className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm"
          style={{ cursor: "crosshair", height: "380px" }}
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
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <LocationPicker setLocation={setLocation} />
            <LocateMeButton
              onLocate={setLocation}
              locating={locating}
              setLocating={setLocating}
            />
            {locationPinned && (
              <Marker position={[latitude!, longitude!]} />
            )}
          </MapContainer>
        </div>
      </section>

      {/* ── Address preview / edit ── */}
      <section aria-labelledby="address-label" aria-live="polite" ref={statusRef}>
        <label
          id="address-label"
          htmlFor="formatted-address"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Delivery address
        </label>

        {geocoding ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500"
          >
            <LuLoaderCircle size={16} className="animate-spin text-[#E23744]" />
            Fetching address details…
          </div>
        ) : (
          <div className="relative">
            <LuMapPin
              size={16}
              className="pointer-events-none absolute left-3 top-3 text-[#E23744]"
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
              className="w-full resize-none rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#E23744] focus:outline-none focus:ring-2 focus:ring-[#E23744]/20 transition"
            />
          </div>
        )}
        <p id="address-hint" className="mt-1 text-xs text-gray-400">
          You can edit this address if it's not precise enough.
        </p>
      </section>

      {/* ── Mobile input ── */}
      <section>
        <label
          htmlFor="mobile-number"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Mobile number
        </label>
        <div className="relative">
          <LuPhone
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={mobileInputRef}
            id="mobile-number"
            type="tel"
            inputMode="numeric"
            placeholder="e.g. 9876543210"
            value={mobile}
            onChange={handleMobileChange}
            aria-invalid={!!mobileError}
            aria-describedby={mobileError ? "mobile-error" : undefined}
            maxLength={15}
            className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 ${
              mobileError
                ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                : "border-gray-200 focus:border-[#E23744] focus:ring-[#E23744]/20"
            }`}
          />
        </div>
        {mobileError && (
          <p
            id="mobile-error"
            role="alert"
            className="mt-1 text-xs text-red-600"
          >
            {mobileError}
          </p>
        )}
      </section>

      {/* ── Save button ── */}
      <button
        disabled={adding || !canSave}
        onClick={addAddress}
        aria-label={adding ? "Saving address…" : "Save this delivery address"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E23744] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c92f3b] focus:outline-none focus:ring-2 focus:ring-[#E23744] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {adding ? (
          <>
            <LuLoaderCircle size={16} className="animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <LuPlus size={16} />
            Save Address
          </>
        )}
      </button>

      {/* ── Saved addresses ── */}
      <section aria-labelledby="saved-heading" className="space-y-3 pb-4">
        <h2 id="saved-heading" className="text-base font-semibold text-gray-900">
          Saved Addresses
        </h2>

        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 text-sm text-gray-400 py-4"
          >
            <LuLoaderCircle size={16} className="animate-spin" />
            Loading addresses…
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
            <LuMapPin size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No addresses saved yet</p>
            <p className="mt-1 text-xs text-gray-400">
              Pin a location above and save it to see it here.
            </p>
          </div>
        ) : (
          <ul role="list" className="space-y-3">
            {addresses.map((addr) => (
              <li
                key={addr._id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50"
                    aria-hidden="true"
                  >
                    <LuMapPin size={15} className="text-[#E23744]" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {addr.formattedAddress}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <LuPhone size={11} />
                      {addr.mobile}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => deleteAddress(addr._id)}
                  disabled={deletingId === addr._id}
                  aria-label={`Delete address: ${addr.formattedAddress}`}
                  className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                >
                  {deletingId === addr._id ? (
                    <LuLoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <LuTrash2 size={16} />
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
