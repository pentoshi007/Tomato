# Demo Seeding

How the backend creates a full demo restaurant cluster around a logged-in user who has no restaurants near their location.

## When seeding happens

Seeding is **not** run for every location. It triggers only when all of these hold:

1. The request is `GET /api/restaurant/nearby` on the restaurant service.
2. The caller is an **authenticated user** (valid JWT) — anonymous visitors never seed.
3. The request has **no `search` query param** — search queries never seed, even with zero results.
4. The query returns **zero restaurants** (verified ones) within the radius (default 8 km) of the user's location.

When all four hold, the restaurant service seeds a demo cluster at that location and re-runs the same query, so the very first response already contains the seeded restaurants. Every later user at a nearby location simply sees the existing cluster — no re-seeding.

## Cluster identity and dedupe

- `demoClusterKey` = `"lat:lng"` with both values rounded to two decimals (~1.1 km grid cell).
- A new cluster is created only if **no demo restaurant exists within 8 km** of the requested point.
- Concurrent requests for the same cluster are guarded by an in-flight promise map.
- A unique partial index on `{ demoClusterKey, name }` for `type: "demo"` documents (restaurants, menu items, riders) makes duplicate seeding impossible even under races.

## What gets seeded

The catalog is fixed (`services/restaurant/src/config/demoCatalog.ts`) — the same nine kitchens for every cluster, repositioned relative to the user:

| Restaurant | Cuisine | Distance | Bearing | Dishes | Price range |
| --- | --- | --- | --- | --- | --- |
| Dragon Wok | Chinese | 1.4 km | 150° | 8 | ₹120–₹280 |
| Spice Junction | North Indian | 1.8 km | 40° | 7 | ₹60–₹360 |
| Biryani House | Biryani | 2.2 km | 330° | 6 | ₹180–₹340 |
| Dosa Corner | South Indian | 2.6 km | 95° | 6 | ₹50–₹120 |
| Sweet Tooth Café | Desserts | 3.0 km | 70° | 8 | ₹110–₹160 |
| Bella Napoli | Italian | 3.4 km | 200° | 7 | ₹240–₹340 |
| Bangkok Street | Thai | 4.1 km | 290° | 7 | ₹190–₹260 |
| Taco Verde | Mexican | 5.2 km | 245° | 5 | ₹210–₹260 |
| The Burger Barn | Burgers | 6.1 km | 20° | 6 | ₹90–₹180 |

60 dishes total, each with a description, INR price and a real image URL.

### Restaurants

Each restaurant is placed at `destinationPoint(userLat, userLng, bearing, distance)` (spherical math in `services/restaurant/src/utils/geo.ts`), so distances and bearings are exact from the user's point. Documents are created with:

- `type: "demo"`, `demoClusterKey`
- `ownerId: "demo:<clusterKey>"` — can never match a real owner lookup
- `isVerified: true`, `isOpen: true` — visible immediately, never enter admin verification queues
- `autoLocation.formattedAddress` composed from a reverse geocode (see below)

### Addresses

The service reverse-geocodes the user's location through the utils service (`GET /api/geocode/reverse`, Nominatim, 5 s timeout) and composes each restaurant's address as:

```
<catalog addressLine>, <suburb>, <city>
```

e.g. `14, Dilli Haat Market, Raisina Hill, New Delhi`. If geocoding fails it falls back to coordinates, so seeding never breaks on a geocoder outage.

### Menu items

All 60 dishes are inserted as `MenuItems` with `restaurantId`, `isAvailable: true`, `type: "demo"`, `demoClusterKey`.

### Riders

Restaurant seeding delegates to the rider service: `POST /api/rider/internal/demo/seed` (guarded by `x-internal-key`), which upserts 14 demo riders around the same location (`services/rider/src/config/demoRiders.ts`):

- Indian male names with portrait photos (randomuser.me), placed 1.3–2.9 km out on spread bearings
- Deterministic fake phone / Aadhaar / DL derived from an FNV-1a hash of `clusterKey:index` — unique per cluster, never colliding with real data
- `isAvailable: false`, `isVerified: true`, `type: "demo"`, `demoClusterKey`
- The real-rider order-offer query filters `type: "normal"`, so demo riders can never receive a real order offer

If `RIDER_SERVICE_URL` is not configured on the restaurant service, rider seeding is skipped (restaurants and menus still seed) — demo orders then stall at `ready_for_rider`.

## Removal

Every demo entity is tagged `type: "demo"`; user-created data defaults to `type: "normal"`. Complete cleanup (mongosh, database `Tomato`):

```js
use Tomato
db.restaurants.deleteMany({ type: "demo" })
db.menuitems.deleteMany({ type: "demo" })
db.riders.deleteMany({ type: "demo" })
db.orders.deleteMany({ type: "demo" })
```

The frontend demo layer (`frontend/src/demo/`) is a separate client-side provider layer and can be deleted independently without touching production flows.

## Verified behavior

End-to-end verified locally (2026-09-10): first nearby call at a fresh location returns the 9 seeded restaurants with images and 1.4–6.1 km distances; a second cluster seeded at a different city with the same catalog; a search query with zero results seeded nothing; normal restaurant creation still works alongside a demo cluster.
