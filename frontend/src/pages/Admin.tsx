import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BiRefresh, BiStore, BiCheck } from "react-icons/bi";
import { adminService } from "../config";
import type { IRider, IRestaurant } from "../types";
import { Logo } from "../components/ui/Logo";
import { Skeleton } from "../components/ui/primitives";
import { Scooter } from "../components/ui/illustrations";
import LogoutButton from "../components/LogoutButton";
import DemoChip from "../demo/DemoChip";

type ReviewTarget = "restaurant" | "rider";

type PendingRestaurantsResponse = {
  restaurants?: IRestaurant[];
};

type PendingRidersResponse = {
  riders?: IRider[];
};

type ApprovalResponse = {
  message?: string;
};

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
  },
});

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return fallback;
};

const formatDate = (value?: string | Date): string => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const maskDocument = (value?: string): string => {
  if (!value) {
    return "Not available";
  }

  const visibleCharacters = value.slice(-4);
  return `${"•".repeat(Math.max(0, value.length - visibleCharacters.length))}${visibleCharacters}`;
};

const getInitial = (value?: string): string =>
  value?.trim().charAt(0).toUpperCase() || "T";

function LoadingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-label="Loading pending reviews">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-48 w-full !rounded-2xl" />
      ))}
    </div>
  );
}

function EmptyQueue({ target }: { target: ReviewTarget }) {
  const label = target === "restaurant" ? "restaurants" : "riders";

  return (
    <div className="card-flat border-dashed bg-butter px-6 py-14 text-center">
      <p className="font-display text-lg font-extrabold">
        Queue clear — no pending {label}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 font-medium text-smoke">
        New {label} awaiting verification will appear here for review.
      </p>
    </div>
  );
}

const DetailCell = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div>
    <dt className="text-[10px] font-black tracking-widest text-smoke uppercase">
      {label}
    </dt>
    <dd
      className={`mt-1 text-sm font-bold ${mono ? "font-mono tracking-wider" : ""}`}
    >
      {value}
    </dd>
  </div>
);

const Admin = () => {
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [riders, setRiders] = useState<IRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ReviewTarget>("restaurant");
  const [approving, setApproving] = useState<{
    target: ReviewTarget;
    id: string;
  } | null>(null);

  const fetchPendingReviews = useCallback(async () => {
    setLoading(true);

    try {
      const [restaurantsResponse, ridersResponse] = await Promise.all([
        axios.get<PendingRestaurantsResponse>(
          `${adminService}/api/v1/admin/restaurants/pending`,
          getAuthConfig(),
        ),
        axios.get<PendingRidersResponse>(
          `${adminService}/api/v1/admin/riders/pending`,
          getAuthConfig(),
        ),
      ]);

      setRestaurants(restaurantsResponse.data.restaurants ?? []);
      setRiders(ridersResponse.data.riders ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load pending reviews"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPendingReviews();
  }, [fetchPendingReviews]);

  const approve = async (target: ReviewTarget, id: string) => {
    setApproving({ target, id });

    try {
      const path =
        target === "restaurant"
          ? `/api/v1/verify/restaurant/${id}`
          : `/api/v1/verify/rider/${id}`;
      const { data } = await axios.patch<ApprovalResponse>(
        `${adminService}${path}`,
        undefined,
        getAuthConfig(),
      );

      if (target === "restaurant") {
        setRestaurants((current) =>
          current.filter((restaurant) => restaurant._id !== id),
        );
      } else {
        setRiders((current) => current.filter((rider) => rider._id !== id));
      }

      toast.success(
        data.message ??
          `${target === "restaurant" ? "Restaurant" : "Rider"} approved successfully`,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          `Unable to approve this ${target === "restaurant" ? "restaurant" : "rider"}`,
        ),
      );
    } finally {
      setApproving(null);
    }
  };

  const isApproving = (target: ReviewTarget, id: string): boolean =>
    approving?.target === target && approving.id === id;

  const activeCount = tab === "restaurant" ? restaurants.length : riders.length;

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b-2 border-ink bg-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Logo size={32} />
          <div className="flex shrink-0 items-center gap-2">
            <DemoChip />
            <span className="chip hidden bg-blush sm:inline-flex">
              Admin portal
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="card relative overflow-hidden bg-ink p-6 text-cream sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black tracking-[0.25em] text-mustard uppercase">
                Tomato · Admin
              </p>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Review pending applications
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 font-medium text-cream/70">
                Verify restaurant partners and delivery riders before they join
                the platform.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchPendingReviews()}
              disabled={loading}
              className="btn bg-mustard text-ink shadow-[2.5px_2.5px_0_0_rgba(255,253,249,0.35)]"
            >
              <BiRefresh
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          <div className="pointer-events-none absolute -right-4 -bottom-8 hidden opacity-90 sm:block" aria-hidden="true">
            <Scooter size={120} />
          </div>
        </div>

        {/* Stat cards */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-blush">
              <BiStore className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] text-smoke uppercase">
                Restaurants
              </p>
              <p className="font-display text-3xl font-extrabold">
                {restaurants.length}
              </p>
              <p className="text-xs font-medium text-smoke">
                Awaiting verification
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-skywash">
              <Scooter size={30} />
            </span>
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] text-smoke uppercase">
                Riders
              </p>
              <p className="font-display text-3xl font-extrabold">
                {riders.length}
              </p>
              <p className="text-xs font-medium text-smoke">
                Awaiting verification
              </p>
            </div>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b-2 border-ink px-5 pt-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <h2 className="font-display text-xl font-extrabold tracking-tight">
                Verification queue
              </h2>
              <p className="mt-1 text-sm font-medium text-smoke">
                Review submitted details and approve eligible partners.
              </p>
            </div>
            <span className="chip mb-3 self-start bg-butter sm:mb-4">
              {activeCount} pending
            </span>
          </div>

          <div
            className="flex border-b-2 border-ink"
            role="tablist"
            aria-label="Verification type"
          >
            {(
              [
                ["restaurant", "Restaurants", restaurants.length],
                ["rider", "Riders", riders.length],
              ] as const
            ).map(([target, label, count]) => {
              const active = tab === target;
              return (
                <button
                  key={target}
                  id={`${target}-tab`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`${target}-panel`}
                  onClick={() => setTab(target)}
                  className={`flex-1 cursor-pointer px-4 py-3 text-sm font-black tracking-wide uppercase transition-colors ${
                    active
                      ? "bg-tomato text-white"
                      : "bg-paper text-smoke hover:bg-butter"
                  }`}
                >
                  {label}
                  <span
                    className={`ml-2 rounded-full border border-ink px-2 py-0.5 text-[10px] ${
                      active ? "bg-paper text-ink" : "bg-mist text-ink"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            id={`${tab}-panel`}
            role="tabpanel"
            aria-labelledby={`${tab}-tab`}
            className="p-5 sm:p-6"
          >
            {loading ? (
              <LoadingCards />
            ) : tab === "restaurant" ? (
              restaurants.length === 0 ? (
                <EmptyQueue target="restaurant" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {restaurants.map((restaurant) => {
                    const approvingRestaurant = isApproving(
                      "restaurant",
                      restaurant._id,
                    );

                    return (
                      <article
                        key={restaurant._id}
                        className="card-flat card-hover overflow-hidden"
                      >
                        <div className="flex gap-4 p-5">
                          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-ink bg-blush font-display text-xl font-extrabold">
                            <span>{getInitial(restaurant.name)}</span>
                            {restaurant.image && (
                              <img
                                src={restaurant.image}
                                alt={`${restaurant.name} restaurant`}
                                className="absolute inset-0 h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-display truncate text-lg font-extrabold">
                                {restaurant.name}
                              </h3>
                              <span className="chip shrink-0 bg-butter !text-[10px]">
                                Pending
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm leading-5 font-medium text-smoke">
                              {restaurant.description ||
                                "No description provided."}
                            </p>
                          </div>
                        </div>

                        <dl className="grid gap-3 border-t-2 border-mist px-5 py-4 sm:grid-cols-2">
                          <DetailCell
                            label="Address"
                            value={
                              restaurant.autoLocation?.formattedAddress ||
                              "Address not provided"
                            }
                          />
                          <DetailCell
                            label="Contact"
                            value={
                              restaurant.phone
                                ? String(restaurant.phone)
                                : "Not provided"
                            }
                          />
                        </dl>

                        <div className="border-t-2 border-ink bg-cream px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              void approve("restaurant", restaurant._id)
                            }
                            disabled={approvingRestaurant}
                            className="btn-primary w-full !py-2.5"
                          >
                            <BiCheck className="h-5 w-5" />
                            {approvingRestaurant
                              ? "Approving…"
                              : "Approve restaurant"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            ) : riders.length === 0 ? (
              <EmptyQueue target="rider" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {riders.map((rider) => {
                  const approvingRider = isApproving("rider", rider._id);

                  return (
                    <article
                      key={rider._id}
                      className="card-flat card-hover overflow-hidden"
                    >
                      <div className="flex gap-4 p-5">
                        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-ink bg-skywash font-display text-xl font-extrabold">
                          <span>R</span>
                          {rider.picture && (
                            <img
                              src={rider.picture}
                              alt="Rider profile"
                              className="absolute inset-0 h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-display text-lg font-extrabold">
                              Delivery rider
                            </h3>
                            <span className="chip shrink-0 bg-butter !text-[10px]">
                              Pending
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-5 font-medium text-smoke">
                            Review identity details before enabling deliveries.
                          </p>
                        </div>
                      </div>

                      <dl className="grid gap-3 border-t-2 border-mist px-5 py-4 sm:grid-cols-2">
                        <DetailCell
                          label="Phone"
                          value={rider.phoneNumber || "Not provided"}
                        />
                        <DetailCell
                          label="Submitted"
                          value={formatDate(rider.createdAt)}
                        />
                        <DetailCell
                          label="Aadhaar"
                          value={maskDocument(rider.aadharNumber)}
                          mono
                        />
                        <DetailCell
                          label="Driving licence"
                          value={maskDocument(rider.drivingLicenseNumber)}
                          mono
                        />
                      </dl>

                      <div className="border-t-2 border-ink bg-cream px-5 py-4">
                        <button
                          type="button"
                          onClick={() => void approve("rider", rider._id)}
                          disabled={approvingRider}
                          className="btn-primary w-full !py-2.5"
                        >
                          <BiCheck className="h-5 w-5" />
                          {approvingRider ? "Approving…" : "Approve rider"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Admin;
