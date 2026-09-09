import { toast } from "react-hot-toast";
import { riderService } from "../config";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/useSocket";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import axios from "axios";
import type { IOrder,IRider } from "../types";
import RiderOrderRequest from "../components/RiderOrderRequest";
import RiderCurrentOrder from "../components/RiderCurrentOrder";
import RiderOrderMap from "../components/RiderOrderMap";




const inputClassName =
  "w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#E23774] focus:ring-2 focus:ring-[#f9c5d8]";

const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return error.response.data.message;
  }

  return fallbackMessage;
};

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
                Authorization: `Bearer ${localStorage.getItem("token")}`,
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
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[28px] bg-linear-to-br from-[#E23774] via-[#ef4b84] to-[#f68caf] p-8 text-white shadow-sm">
          <div className="max-w-lg space-y-5">
            <span className="inline-flex rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
              Rider Onboarding
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                Complete your rider profile and start receiving deliveries.
              </h1>
              <p className="text-sm leading-6 text-white/85 sm:text-base">
                We could not find a rider profile for your account. Add the
                backend-required details below so your documents can be reviewed
                and your delivery account can be activated.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                  Required
                </p>
                <p className="mt-2 text-sm font-semibold">
                  Phone, Aadhar, license and profile photo
                </p>
              </div>
              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                  Location
                </p>
                <p className="mt-2 text-sm font-semibold">
                  Live location is captured during signup
                </p>
              </div>
              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                  Review
                </p>
                <p className="mt-2 text-sm font-semibold">
                  You can go online once verification is approved
                </p>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-gray-900">
              Rider details
            </h2>
            <p className="text-sm text-gray-500">
              These fields match the rider service payload and are used to
              create your profile.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="phoneNumber"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                required
                value={phoneNumber}
                onChange={handlePhoneChange}
                className={inputClassName}
                placeholder="Enter your 10 digit phone number"
              />
            </div>

            <div>
              <label
                htmlFor="aadharNumber"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Aadhar Number
              </label>
              <input
                id="aadharNumber"
                type="text"
                required
                value={aadharNumber}
                onChange={handleAadharChange}
                className={inputClassName}
                placeholder="Enter your 12 digit Aadhar number"
              />
            </div>

            <div>
              <label
                htmlFor="drivingLicenseNumber"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Driving License Number
              </label>
              <input
                id="drivingLicenseNumber"
                type="text"
                required
                value={drivingLicenseNumber}
                onChange={handleLicenseChange}
                className={inputClassName}
                placeholder="Enter your driving license number"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Profile Picture
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-[#E23774] hover:bg-rose-50/50">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {file ? file.name : "Upload a clear rider photo"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Accepts image files and sends the file field expected by the
                    rider backend.
                  </p>
                </div>
                <span className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-[#E23774]">
                  Choose File
                </span>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
            Your current location will be requested when you submit this form
            because the rider service requires `latitude` and `longitude` during
            profile creation.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-[#E23774] py-3 text-sm font-semibold text-white transition hover:bg-[#d91f66] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating rider profile..." : "Create rider profile"}
          </button>
        </form>
      </div>
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
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const player = new Audio("/sounds/faahh.mp3");
    player.preload = "auto";
    audioRef.current = player;

    return () => {
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
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const persistedSoundEnabled = Boolean(
        data.soundEnabled ?? nextSoundEnabled,
      );

      setSoundEnabled(persistedSoundEnabled);
      setAudioUnlocked(persistedSoundEnabled);
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
      setAudioUnlocked(soundEnabled);
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

      if (audioUnlocked && soundEnabled && audioRef.current) {
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
  }, [socket, audioUnlocked, soundEnabled]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${riderService}/api/rider/myprofile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const rider = data || null;
      const persistedSoundEnabled = Boolean(rider?.soundEnabled);
      setProfile(rider);
      setSoundEnabled(persistedSoundEnabled);
      setAudioUnlocked(persistedSoundEnabled);
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
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
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
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            You are not registered as a rider
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Switch to a rider account to access delivery tools and rider profile
            setup.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white px-8 py-6 text-center shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#f8d2df] border-t-[#E23774]"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading your rider dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <RiderRegistrationForm onRegistered={fetchProfile} />;
  }

  const hasActiveOrder = Boolean(currentOrder);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[28px] bg-linear-to-r from-[#E23774] via-[#ef4b84] to-[#f68caf] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={profile.picture}
                alt="Rider profile"
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/30"
              />
              <div>
                <p className="text-sm text-white/80">Rider Dashboard</p>
                <h1 className="text-3xl font-bold">
                  Welcome back, {user?.name || "Rider"}
                </h1>
                <p className="mt-1 text-sm text-white/85">
                  Manage your verification status, go online, and stay ready for
                  nearby delivery requests.
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
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                hasActiveOrder || currentOrderLoading
                  ? "bg-gray-700 text-white"
                  : profile.isAvailable
                    ? "bg-white text-[#E23774] hover:bg-rose-50"
                    : "bg-gray-900 text-white hover:bg-gray-800"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {toggling
                ? "Updating status..."
                : currentOrderLoading
                  ? "Checking current order..."
                  : hasActiveOrder
                    ? "Order in progress"
                    : profile.isAvailable
                      ? "Go offline"
                      : "Go online"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#f7d0dc] bg-[#fff7fa] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Delivery notifications
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {incomingOrders.length > 0
                    ? `${incomingOrders.length} order${incomingOrders.length === 1 ? "" : "s"} available nearby`
                    : "No new delivery requests"}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`rounded-full px-3 py-2 text-xs font-semibold ring-1 transition hover:bg-rose-50 ${
                  soundEnabled
                    ? "bg-white text-gray-700 ring-[#f7d0dc]"
                    : "bg-white text-[#E23774] ring-[#f7d0dc]"
                }`}
              >
                {soundEnabled ? "Disable sound" : "Enable sound"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">Current order</p>
            <p className="mt-1 text-xs text-gray-500">
              {currentOrder
                ? `${currentOrder.restaurantName} · #${currentOrder._id.slice(-6)}`
                : "No active order assigned"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Profile details
                </h2>
                <p className="text-sm text-gray-500">
                  Your rider information saved in the backend.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Phone Number
                </p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {profile.phoneNumber}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Aadhar Number
                </p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {profile.aadharNumber}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Driving License
                </p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {profile.drivingLicenseNumber}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Joined
                </p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Account status
              </h2>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Verification
                    </p>
                    <p className="text-xs text-gray-500">
                      Admin approval is required before going online.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      profile.isVerified
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {profile.isVerified ? "Verified" : "Pending"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Availability
                    </p>
                    <p className="text-xs text-gray-500">
                      Live delivery status shared with the rider service.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      profile.isAvailable
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {profile.isAvailable ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-4">
                  <p className="text-sm font-medium text-gray-900">
                    Last active
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {new Date(profile.lastActiveAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-[28px] border border-[#f7d0dc] bg-[#fff7fa] p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  {/* Show appropriate heading based on verification status */}
                  {!profile.isVerified
                    ? "Verification in progress"
                    : "Important Information"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {/* If not verified, show verification info per instructions */}
                  {!profile.isVerified
                    ? "Your rider profile has been created successfully. Once your details are reviewed and approved, the go online button will be enabled automatically."
                    : "Please be within 500 meters (hotspot) of any restaurant to receive delivery requests."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {profile.isAvailable && incomingOrders.length > 0 && (
        <div className="mx-auto">
          <h3>Incoming Orders</h3>
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
    </div>
  );
};

export default RiderDashboard;
