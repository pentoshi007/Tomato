import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BiRefresh } from "react-icons/bi";
import { adminService } from "../config";
import type { IRider, IRestaurant } from "../types";

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

const getInitial = (value?: string): string => value?.trim().charAt(0).toUpperCase() || "T";

function LoadingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-label="Loading pending reviews">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-rose-100" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-4/5 rounded bg-gray-100" />
            </div>
          </div>
          <div className="mt-6 h-10 w-full rounded-xl bg-rose-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ target }: { target: ReviewTarget }) {
  const label = target === "restaurant" ? "restaurants" : "riders";

  return (
    <div className="rounded-3xl border border-dashed border-[#f7d0dc] bg-[#fff7fa] px-6 py-14 text-center">
      <p className="text-lg font-semibold text-gray-900">
        No pending {label}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        New {label} awaiting verification will appear here for review.
      </p>
    </div>
  );
}

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
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[28px] bg-linear-to-r from-[#E23774] via-[#ef4b84] to-[#f68caf] p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium tracking-wide text-white/80">
                TOMATO · ADMIN PORTAL
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Review pending applications
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                Verify restaurant partners and delivery riders before they join
                the platform.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchPendingReviews()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#E23774] transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <BiRefresh
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              {loading ? "Refreshing..." : "Refresh reviews"}
            </button>
          </div>
        </header>

        <section
          className="grid gap-4 sm:grid-cols-3"
          aria-label="Pending review summary"
        >
          <div className="rounded-2xl border border-[#f7d0dc] bg-[#fff7fa] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E23774]">
              Total queue
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {restaurants.length + riders.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">Applications to review</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Restaurants
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {restaurants.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">Awaiting verification</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Riders
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{riders.length}</p>
            <p className="mt-1 text-sm text-gray-500">Awaiting verification</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 pt-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Verification queue
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Review submitted details and approve eligible partners.
              </p>
            </div>
            <span className="self-start rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 sm:mb-4 sm:self-auto">
              {activeCount} pending
            </span>
          </div>

          <div
            className="flex gap-6 border-b border-gray-100 px-5 sm:px-6"
            role="tablist"
            aria-label="Verification type"
          >
            {([
              ["restaurant", "Restaurants", restaurants.length],
              ["rider", "Riders", riders.length],
            ] as const).map(([target, label, count]) => {
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
                  className={`border-b-2 px-1 py-4 text-sm font-semibold transition ${
                    active
                      ? "border-[#E23774] text-[#E23774]"
                      : "border-transparent text-gray-500 hover:text-[#E23774]"
                  }`}
                >
                  {label}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      active
                        ? "bg-[#fff0f5] text-[#E23774]"
                        : "bg-gray-100 text-gray-500"
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
                <EmptyState target="restaurant" />
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
                        className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:border-[#f7d0dc] hover:shadow-md"
                      >
                        <div className="flex gap-4 p-5">
                          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#fff0f5] text-xl font-bold text-[#E23774]">
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
                              <h3 className="truncate text-lg font-semibold text-gray-900">
                                {restaurant.name}
                              </h3>
                              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                Pending
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500">
                              {restaurant.description || "No description provided."}
                            </p>
                          </div>
                        </div>

                        <dl className="grid gap-3 border-t border-gray-100 px-5 py-4 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              Address
                            </dt>
                            <dd className="mt-1 line-clamp-2 text-gray-700">
                              {restaurant.autoLocation?.formattedAddress ||
                                "Address not provided"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              Contact
                            </dt>
                            <dd className="mt-1 text-gray-700">
                              {restaurant.phone || "Not provided"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              Submitted
                            </dt>
                            <dd className="mt-1 text-gray-700">
                              {formatDate(restaurant.createdAt)}
                            </dd>
                          </div>
                        </dl>

                        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                          <button
                            type="button"
                            onClick={() => void approve("restaurant", restaurant._id)}
                            disabled={approvingRestaurant}
                            className="w-full rounded-xl bg-[#E23774] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#cc2f67] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {approvingRestaurant
                              ? "Approving restaurant..."
                              : "Approve restaurant"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            ) : riders.length === 0 ? (
              <EmptyState target="rider" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {riders.map((rider) => {
                  const approvingRider = isApproving("rider", rider._id);

                  return (
                    <article
                      key={rider._id}
                      className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:border-[#f7d0dc] hover:shadow-md"
                    >
                      <div className="flex gap-4 p-5">
                        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#fff0f5] text-xl font-bold text-[#E23774]">
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
                            <h3 className="text-lg font-semibold text-gray-900">
                              Delivery rider
                            </h3>
                            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              Pending
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-5 text-gray-500">
                            Review identity details before enabling deliveries.
                          </p>
                        </div>
                      </div>

                      <dl className="grid gap-3 border-t border-gray-100 px-5 py-4 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Phone
                          </dt>
                          <dd className="mt-1 text-gray-700">
                            {rider.phoneNumber || "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Submitted
                          </dt>
                          <dd className="mt-1 text-gray-700">
                            {formatDate(rider.createdAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Aadhaar
                          </dt>
                          <dd className="mt-1 font-medium tracking-wider text-gray-700">
                            {maskDocument(rider.aadharNumber)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Driving licence
                          </dt>
                          <dd className="mt-1 font-medium tracking-wider text-gray-700">
                            {maskDocument(rider.drivingLicenseNumber)}
                          </dd>
                        </div>
                      </dl>

                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                        <button
                          type="button"
                          onClick={() => void approve("rider", rider._id)}
                          disabled={approvingRider}
                          className="w-full rounded-xl bg-[#E23774] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#cc2f67] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {approvingRider ? "Approving rider..." : "Approve rider"}
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
