import { toast } from "react-hot-toast";
import { riderService } from "../config";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/useSocket";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import axios from "axios";
import type { IOrder, IRider } from "../types";
import RiderOrderRequest from "../components/RiderOrderRequest";
import RiderCurrentOrder from "../components/RiderCurrentOrder";
import RiderOrderMap from "../components/RiderOrderMap";
import { Logo } from "../components/ui/Logo";
import { PageLoader, Spinner } from "../components/ui/primitives";
import { Scooter, Sparkle } from "../components/ui/illustrations";
import LogoutButton from "../components/LogoutButton";
import DemoChip from "../demo/DemoChip";
import {
  BiUpload,
  BiBell,
  BiBellOff,
  BiPackage,
  BiCheckShield,
  BiTimeFive,
} from "react-icons/bi";

const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  return fallbackMessage;
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const RiderRegistrationForm = ({
  onRegistered,
}: {
  onRegistered: () => void | Promise<void>;
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
  };

  const handleAadharChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAadharNumber(e.target.value.replace(/\D/g, "").slice(0, 12));
  };

  const handleLicenseChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDrivingLicenseNumber(e.target.value.toUpperCase().slice(0, 20));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (phoneNumber.length !== 10) {
      toast.error("Phone number must be 10 digits");
      return;
    }

    if (aadharNumber.length !== 12) {
      toast.error("Aadhar number must be 12 digits");
      return;
    }

    if (!file) {
      toast.error("Please upload a picture");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Location access is required to register as a rider");
      return;
    }

    setSubmitting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("phoneNumber", phoneNumber);
          formData.append("aadharNumber", aadharNumber);
          formData.append("drivingLicenseNumber", drivingLicenseNumber);
          formData.append("latitude", String(position.coords.latitude));
          formData.append("longitude", String(position.coords.longitude));

          const { data } = await axios.post(
            `${riderService}/api/rider/new`,
            formData,
            {
              headers: {
                ...authHeaders(),
                "Content-Type": "multipart/form-data",
              },
            },
          );

          toast.success(data?.message || "Rider profile created successfully");
          await onRegistered();
        } catch (error) {
          console.error(error);
          toast.error(
            getApiErrorMessage(error, "Failed to create rider profile"),
          );
        } finally {
          setSubmitting(false);
        }
      },
      (error) => {
        console.error(error);
        toast.error("Unable to fetch your location");
        setSubmitting(false);
      },
    );
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Logo size={32} />
          <div className="flex shrink-0 items-center gap-2">
            <DemoChip />
            <span className="chip hidden bg-skywash sm:inline-flex">
              Rider hub
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Onboarding panel — flat color, no gradients */}
        <div className="card relative overflow-hidden bg-ink p-8 text-cream">
          <span className="sticker bg-mustard text-ink">
            <Sparkle size={13} /> Rider onboarding
          </span>
          <h1 className="font-display mt-5 max-w-md text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            Complete your rider profile and start receiving deliveries.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 font-medium text-cream/75">
            Add the required details below so your documents can be reviewed and
            your delivery account activated.
          </p>

          <div className="mt-6 grid max-w-md gap-3 sm:grid-cols-3">
            {[
              { title: "Required", body: "Phone, Aadhar, license & photo" },
              { title: "Location", body: "Captured live during signup" },
              { title: "Review", body: "Go online once approved" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border-2 border-cream/25 p-3.5"
              >
                <p className="text-[10px] font-black tracking-[0.2em] text-mustard uppercase">
                  {item.title}
                </p>
                <p className="mt-1.5 text-xs leading-snug font-semibold text-cream/85">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-90" aria-hidden="true">
            <Scooter size={150} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            Rider details
          </h2>
          <p className="mt-1 text-sm font-medium text-smoke">
            Used to create and verify your rider profile.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="label">
                Phone number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="aadharNumber" className="label">
                Aadhar number
              </label>
              <input
                id="aadharNumber"
                type="text"
                inputMode="numeric"
                placeholder="12-digit Aadhar"
                value={aadharNumber}
                onChange={handleAadharChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="drivingLicenseNumber" className="label">
                Driving license number
              </label>
              <input
                id="drivingLicenseNumber"
                type="text"
                placeholder="DL-0420110149646"
                value={drivingLicenseNumber}
                onChange={handleLicenseChange}
                className="input"
              />
            </div>

            <div>
              <span className="label">Profile photo</span>
              <label className="card-flat flex cursor-pointer items-center gap-3 border-dashed p-4 text-sm font-bold text-smoke transition-colors hover:bg-butter">
                <BiUpload className="h-5 w-5 shrink-0 text-tomato" />
                <span className="truncate">
                  {file ? file.name : "Upload your photo"}
                </span>
                <input
                  id="picture"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="card-flat mt-5 !bg-skywash p-3.5 text-xs font-bold">
            Your live location will be captured when you submit — the rider
            service needs it to activate your profile.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary mt-5 w-full !py-3"
          >
            {submitting && <Spinner size={16} className="text-white" />}
            {submitting ? "Creating profile…" : "Create rider profile"}
          </button>
        </form>
      </main>
    </div>
  );
};

const RiderDashboard = () => {
  const { user } = useAppContext();
  const { socket } = useSocket();
  const [profile, setProfile] = useState<IRider | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<boolean>(false);

  const [incomingOrders, setIncomingOrders] = useState<string[]>([]);
  const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);
  const [currentOrderLoading, setCurrentOrderLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const player = new Audio("/sounds/faahh.mp3");
    player.preload = "auto";
    audioRef.current = player;
    const unlock = () => {
      player
        .play()
        .then(() => {
          player.pause();
          player.currentTime = 0;
        })
        .catch(() => {});
    };
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      player.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleSound = async () => {
    const nextSoundEnabled = !soundEnabled;

    try {
      if (nextSoundEnabled && audioRef.current) {
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const { data } = await axios.patch(
        `${riderService}/api/rider/sound`,
        { soundEnabled: nextSoundEnabled },
        { headers: authHeaders() },
      );
      const persistedSoundEnabled = Boolean(
        data.soundEnabled ?? nextSoundEnabled,
      );

      setSoundEnabled(persistedSoundEnabled);
      setProfile((current) =>
        current
          ? { ...current, soundEnabled: persistedSoundEnabled }
          : current,
      );
      toast.success(
        persistedSoundEnabled ? "Sound enabled" : "Sound disabled",
      );
    } catch (error) {
      console.log("Sound preference update failed:", error);
      toast.error(
        nextSoundEnabled ? "Could not enable sound" : "Could not disable sound",
      );
    }
  };

  useEffect(() => {
    if (!socket) return;

    const onOrderAvailable = ({ orderId }: { orderId: string }) => {
      setIncomingOrders((prev) =>
        prev.includes(orderId) ? prev : [...prev, orderId],
      );

      if (soundEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.log("Order notification audio failed:", error);
        });
      }

      window.setTimeout(() => {
        setIncomingOrders((prev) => prev.filter((id) => id !== orderId));
      }, 10_000);
    };

    socket.on("order:available", onOrderAvailable);
    return () => {
      socket.off("order:available", onOrderAvailable);
    };
  }, [socket, soundEnabled]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${riderService}/api/rider/myprofile`, {
        headers: authHeaders(),
      });

      const rider = data || null;
      const persistedSoundEnabled = Boolean(rider?.soundEnabled);
      setProfile(rider);
      setSoundEnabled(persistedSoundEnabled);
    } catch (error) {
      setProfile(null);
      if (!(axios.isAxiosError(error) && error.response?.status === 404)) {
        toast.error("Failed to fetch profile");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "rider") {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCurrentOrder = async () => {
    setCurrentOrderLoading(true);
    try {
      const { data } = await axios.get(
        `${riderService}/api/rider/current/order`,
        { headers: authHeaders() },
      );
      setCurrentOrder(data.order);
    } catch {
      setCurrentOrder(null);
    } finally {
      setCurrentOrderLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      void fetchCurrentOrder();
    } else {
      setCurrentOrder(null);
      setCurrentOrderLoading(false);
    }
  }, [profile]);

  const toggleAvailability = async () => {
    if (currentOrderLoading) return;
    if (currentOrder) {
      toast.error("Complete your current order before going online");
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Location access is required to toggle availability");
      return;
    }
    setToggling(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await axios.patch(
            `${riderService}/api/rider/toggle`,
            {
              isAvailable: !profile?.isAvailable,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            { headers: authHeaders() },
          );

          if (!response.data.rider) {
            throw new Error("Failed to toggle availability");
          }
          setProfile(response.data.rider);
          toast.success(
            `You are now ${profile?.isAvailable ? "offline" : "online"}`,
          );
        } catch (error) {
          console.error(error);
          toast.error(
            getApiErrorMessage(error, "Failed to toggle availability"),
          );
        } finally {
          setToggling(false);
        }
        fetchProfile();
      },
      (error) => {
        console.error(error);
        toast.error("Unable to fetch your location");
        setToggling(false);
      },
    );
  };

  if (user?.role !== "rider") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="card max-w-md p-8 text-center">
          <h1 className="font-display text-2xl font-extrabold">
            Not a rider account
          </h1>
          <p className="mt-3 text-sm font-medium text-smoke">
            Switch to a rider account to access delivery tools and rider
            profile setup.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <PageLoader label="Starting your engine…" />;
  }

  if (!profile) {
    return <RiderRegistrationForm onRegistered={fetchProfile} />;
  }

  const hasActiveOrder = Boolean(currentOrder);

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur-[2px]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Logo size={32} />
          <div className="flex shrink-0 items-center gap-2">
            <DemoChip />
            <span className="chip hidden bg-skywash sm:inline-flex">
              Rider hub
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Hero card */}
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-6 bg-ink p-6 text-cream lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={profile.picture}
                alt="Rider profile"
                className="h-20 w-20 rounded-2xl border-2 border-cream object-cover shadow-pop-sm"
              />
              <div>
                <p className="text-xs font-black tracking-widest text-mustard uppercase">
                  Rider dashboard
                </p>
                <h1 className="font-display mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Welcome back, {user?.name || "Rider"}
                </h1>
                <p className="mt-1 text-sm font-medium text-cream/70">
                  {profile.isAvailable
                    ? "You're online — stay near hotspots for requests."
                    : "Go online to start receiving delivery requests."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleAvailability}
              disabled={
                toggling ||
                !profile.isVerified ||
                currentOrderLoading ||
                hasActiveOrder
              }
              className={`btn !px-6 !py-3 !text-sm ${
                profile.isAvailable
                  ? "bg-cream text-ink shadow-[2.5px_2.5px_0_0_var(--color-tomato)]"
                  : "bg-basil text-white shadow-[2.5px_2.5px_0_0_rgba(255,253,249,0.35)]"
              }`}
            >
              {toggling
                ? "Updating…"
                : currentOrderLoading
                  ? "Checking order…"
                  : hasActiveOrder
                    ? "Order in progress"
                    : profile.isAvailable
                      ? "Go offline"
                      : "Go online"}
            </button>
          </div>

          <div className="grid gap-px border-t-2 border-ink bg-ink sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4 bg-paper p-4">
              <div>
                <p className="text-sm font-bold">Delivery notifications</p>
                <p className="mt-0.5 text-xs font-medium text-smoke">
                  {incomingOrders.length > 0
                    ? `${incomingOrders.length} order${incomingOrders.length === 1 ? "" : "s"} available nearby`
                    : "No new delivery requests"}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`${soundEnabled ? "btn-secondary" : "btn-primary"} !py-2 !text-xs`}
              >
                {soundEnabled ? (
                  <>
                    <BiBellOff className="h-4 w-4" /> Mute
                  </>
                ) : (
                  <>
                    <BiBell className="h-4 w-4" /> Enable sound
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 bg-paper p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-butter">
                <BiPackage className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">Current order</p>
                <p className="mt-0.5 text-xs font-medium text-smoke">
                  {currentOrder
                    ? `${currentOrder.restaurantName} · #${currentOrder._id.slice(-6)}`
                    : "No active order assigned"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile + status */}
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card p-6">
            <h2 className="font-display text-xl font-extrabold tracking-tight">
              Profile details
            </h2>
            <p className="mt-0.5 text-sm font-medium text-smoke">
              Your rider information saved in the backend.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="card-flat !bg-cream p-4">
                <p className="text-[10px] font-black tracking-[0.2em] text-smoke uppercase">
                  Phone number
                </p>
                <p className="mt-1.5 text-sm font-extrabold">
                  {profile.phoneNumber}
                </p>
              </div>
              <div className="card-flat !bg-cream p-4">
                <p className="text-[10px] font-black tracking-[0.2em] text-smoke uppercase">
                  Aadhar
                </p>
                <p className="mt-1.5 text-sm font-extrabold">
                  {profile.aadharNumber}
                </p>
              </div>
              <div className="card-flat !bg-cream p-4">
                <p className="text-[10px] font-black tracking-[0.2em] text-smoke uppercase">
                  Driving license
                </p>
                <p className="mt-1.5 text-sm font-extrabold">
                  {profile.drivingLicenseNumber}
                </p>
              </div>
              <div className="card-flat !bg-cream p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-smoke uppercase">
                      Availability
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-smoke">
                      Shared live with the rider service.
                    </p>
                  </div>
                  <span
                    className={`chip ${profile.isAvailable ? "bg-mint" : "bg-mist"}`}
                  >
                    {profile.isAvailable ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
              <div className="card-flat border-dashed p-4 sm:col-span-2">
                <p className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] text-smoke uppercase">
                  <BiTimeFive className="h-3.5 w-3.5" /> Last active
                </p>
                <p className="mt-1.5 text-sm font-bold">
                  {profile.lastActiveAt
                    ? new Date(profile.lastActiveAt).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="card !bg-butter p-6">
              <h3 className="font-display flex items-center gap-2 text-lg font-extrabold">
                <BiCheckShield className="h-5 w-5 text-tomato" />
                {!profile.isVerified
                  ? "Verification in progress"
                  : "Hotspot rule"}
              </h3>
              <p className="mt-2 text-sm leading-6 font-medium text-ink/75">
                {!profile.isVerified
                  ? "Your rider profile has been created. Once your details are reviewed and approved, the go online button will be enabled automatically."
                  : "Stay within 500 meters of any restaurant to receive delivery requests."}
              </p>
            </div>
          </div>
        </div>

        {profile.isAvailable && incomingOrders.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-display flex items-center gap-2 text-xl font-extrabold tracking-tight">
              Incoming orders
              <span className="chip bg-tomato text-white">
                {incomingOrders.length}
              </span>
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {incomingOrders.map((id) => (
                <RiderOrderRequest
                  key={id}
                  orderId={id}
                  onAccepted={() => {
                    fetchCurrentOrder();
                    fetchProfile();
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {currentOrder && (
          <>
            <RiderCurrentOrder
              currentOrder={currentOrder}
              onStatusUpdate={fetchCurrentOrder}
            />
            <RiderOrderMap currentOrder={currentOrder} />
          </>
        )}
      </main>
    </div>
  );
};

export default RiderDashboard;
