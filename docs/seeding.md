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

The catalog is fixed (`services/restaurant/src/config/demoCatalog.ts`) — the same nine kitchens for every cluster. **Positions and addresses are real**: the seeder queries OpenStreetMap (Overpass API) for named food places (restaurant / fast_food / cafe / food_court) within 7 km of the user, then picks nine of them — one from each distance band from nearest to farthest, preferring POIs with full street addresses — and places the demo kitchens at those exact coordinates with their real addresses:

| Restaurant | Cuisine | Dishes | Price range |
| --- | --- | --- | --- |
| Dragon Wok | Chinese | 8 | ₹120–₹280 |
| Spice Junction | North Indian | 7 | ₹60–₹360 |
| Biryani House | Biryani | 6 | ₹180–₹340 |
| Dosa Corner | South Indian | 6 | ₹50–₹120 |
| Sweet Tooth Café | Desserts | 8 | ₹110–₹160 |
| Bella Napoli | Italian | 7 | ₹240–₹340 |
| Bangkok Street | Thai | 7 | ₹190–₹260 |
| Taco Verde | Mexican | 5 | ₹210–₹260 |
| The Burger Barn | Burgers | 6 | ₹90–₹180 |

60 dishes total, each with a description, INR price and a real image URL. The distance chips on the home page are computed from the real coordinates, so "1.8 km" means 1.8 km on the actual map.

If Overpass is unreachable (both public mirrors time out, 7 s budget), the seeder falls back to deterministic offset placement with suburb/city composed from a reverse geocode — the app still works, addresses just stop being street-exact until the next fresh cluster seeds.

### Restaurants

Each restaurant is placed at a real OSM food POI coordinate (Overpass `nwr["name"]["amenity"...]` query, `services/restaurant/src/utils/overpassPois.ts`; mirrors queried in parallel, first success wins). Documents are created with:

- `type: "demo"`, `demoClusterKey`
- `ownerId: "demo:<clusterKey>"` — can never match a real owner lookup
- `isVerified: true`, `isOpen: true` — visible immediately, never enter admin verification queues
- `autoLocation.formattedAddress` built from the POI's own address tags (see below)

### Addresses

Each POI contributes its OSM address tags, composed as:

```
<housenumber> <street>, <suburb/neighbourhood>, <city/town/village>, <postcode>
```

e.g. `12 St. Dominic Street, Bandra West, Mumbai, 400050` — a real, existing address at those exact coordinates. Missing tags fall back to the POI name, and the reverse-geocoded city fills gaps, so the composition never produces an empty line.

### Menu items

All 60 dishes are inserted as `MenuItems` with `restaurantId`, `isAvailable: true`, `type: "demo"`, `demoClusterKey`.

### Riders

Restaurant seeding delegates to the rider service: `POST /api/rider/internal/demo/seed` (guarded by `x-internal-key`), which upserts 14 demo riders around the same location (`services/rider/src/config/demoRiders.ts`):

- Indian male names with portrait photos (randomuser.me), placed 1.3–2.9 km out on spread bearings
- Deterministic fake phone / Aadhaar / DL derived from an FNV-1a hash of `clusterKey:index` — unique per cluster, never colliding with real data
- `isAvailable: false`, `isVerified: true`, `type: "demo"`, `demoClusterKey`
- The real-rider order-offer query filters `type: "normal"`, so demo riders can never receive a real order offer

Rider seeding is fire-and-forget from the restaurant service (it never blocks or fails the nearby response). If `RIDER_SERVICE_URL` is missing or the rider service is cold when a cluster seeds, the rider service backfills the cluster's riders on the next demo `ORDER_READY_FOR_RIDER` event before claiming a rider — demo orders no longer stall at `ready_for_rider`.

## Robustness and performance

- **Self-healing geo indexes**: Mongoose builds indexes once per boot. If the database is dropped while services run (collections recreated without the 2dsphere index), every `$near` query would 500 permanently. The restaurant and rider services now detect `unable to find index for $geoNear query` errors, rebuild indexes once (`createIndexes`), and retry the query — verified by dropping the live database mid-run and serving the next nearby request successfully without a restart.
- **Index-independent dedupe**: the seed-dedupe check uses `$geoWithin`/`$centerSphere`, which works even when the 2dsphere index is missing, so seeding never wedges behind a broken index.
- **Fast seeding**: one Overpass POI query (mirrors in parallel, 7 s budget, first success wins) plus one reverse-geocode (3 s timeout, cached per cluster) and batched `insertMany` calls for restaurants and menus; a fresh cluster seeds in ~1–3 s end-to-end, and repeat nearby calls on an existing cluster are single-digit milliseconds.
- **Graceful POI fallback**: if both Overpass mirrors are down, seeding still completes using deterministic offsets and reverse-geocoded suburb/city — the nearby request never 500s or hangs beyond the POI budget.
- **Idempotent everything**: restaurant, menu, and rider seeding are all check-then-batch upserts keyed on `demoClusterKey` — reruns seed nothing, concurrent seeds dedupe via the unique partial index.

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

End-to-end verified locally (2026-09-10): first nearby call at a fresh location returns the 9 seeded restaurants with images and real 0.4–6.1 km distances at real OSM street addresses; a second cluster seeded at a different city with the same catalog; a search query with zero results seeded nothing; normal restaurant creation still works alongside a demo cluster.

## Demo rider routes (road-following movement)

Demo delivery no longer moves in straight lines. When a demo order reaches `ORDER_READY_FOR_RIDER`:

1. The rider service claims a cluster demo rider (rotation per user, excluding the previous order's rider).
2. It fetches a **driving route** from OSRM (`services/rider/src/utils/routePath.ts`, public router, 5 s timeout): rider → restaurant for pickup, then restaurant → delivery address for delivery. Exact door coordinates are kept as the path endpoints (OSRM snaps to the road, the last metres are walked to the marker).
3. It emits `rider:route` to the `user:<userId>` socket room with `{ orderId, phase: "pickup"|"delivery", path, startedAt, durationMs }` and persists the same route on the order (`PUT /api/order/route` → `activeRoute`), so reloading the order page redraws the exact same path.
4. Every ~3 s it emits `rider:location` points interpolated **along the road path** (speed: 22 s/km pickup, 26 s/km delivery, minimums 15 s / 20 s, based on the real road distance).

The customer map (`frontend/src/components/UserOrderMap.tsx`) draws the emitted path as a red polyline, animates the rider along it (requestAnimationFrame, resynced by live `rider:location` pings), and pins the restaurant (🍜), rider (🛵) and delivery address (🏠). Orders without a route (real riders) keep the previous behaviour: the map routes live from the rider's current position to the address.

If OSRM is unreachable, the movement falls back to a straight-line path between the same endpoints — delivery still completes on schedule. Real rider and restaurant flows are untouched: the routing only runs on the demo branch of the order-ready consumer.
