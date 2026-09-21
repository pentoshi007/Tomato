# Tomato — Engineering Notes

## Demo mode (backend seeding + automation)

When an authenticated user has no restaurants near their location, the backend seeds a full demo cluster around them and then runs the entire order lifecycle automatically. Users order and pay for real (Razorpay/Stripe) and receive a real order id; everything after payment — kitchen acceptance, preparation, rider assignment, map movement, delivery — happens on its own.

### Seeding

- **Trigger:** `GET /api/restaurant/nearby` with a valid session, no `search` query param, and zero results within the 8 km default radius. The cluster is seeded and the same response already returns it.
- **Cluster identity:** `demoClusterKey` = `"lat:lng"` rounded to two decimals (~1.1 km grid).
- **Dedupe:** a new cluster is only created when no demo restaurant exists within 8 km; concurrent requests are guarded by an in-flight map; a unique partial index on `(demoClusterKey, name)` for `type: "demo"` (restaurants, menu items and riders) makes double-seeding impossible.
- **Restaurants:** nine kitchens — North Indian, Chinese, Italian, Mexican, Thai, burgers, desserts, South Indian and biryani — placed at 1.4–6.1 km on spread bearings. Images come from public CDNs (TheMealDB, Wikimedia Commons, Unsplash). `formattedAddress` is composed from a reverse geocode via the utils service (`/api/geocode/reverse`, 5 s timeout, falls back to coordinates).
- **Menus:** 60 dishes across the cluster with INR prices and images, seeded as `MenuItems` with `isAvailable: true`.
- **Riders:** the restaurant service delegates to the rider service — `POST /api/rider/internal/demo/seed` (guarded by `x-internal-key`). Fourteen demo riders (Indian names, portrait photos) are seeded around the location with deterministic fake phone/Aadhar/DL derived from the cluster key. They are `isAvailable: false` and `isVerified: true`, and the real-rider notification query filters `type: "normal"`, so demo riders can never receive a real order offer.

### Order lifecycle

1. User places an order at a demo restaurant and pays for real through the utils service (Razorpay/Stripe). The order inherits `type: "demo"` from the restaurant.
2. `PAYMENT_SUCCESS` lands on the `payment_event` queue; the restaurant service marks the order paid (normal flow).
3. **Kitchen automation** (restaurant service, in-process): `placed → accepted` (12 s) → `preparing` (18 s) → `ready_for_rider` (20 s). Every step is a guarded `findOneAndUpdate` on the expected from-status plus `paymentStatus: "paid"`, so replays and races are no-ops. Each transition emits `order:update` to the `user:<id>` room through the realtime service. Kitchens interrupted by a restart resume on boot.
4. `ORDER_READY_FOR_RIDER` is published on the `order_ready_event` queue with the demo flag, cluster key and restaurant/delivery locations.
5. **Delivery automation** (rider service): claims a demo rider atomically (LRU by `lastActiveAt`, cluster-scoped, excluding the rider from this user's previous demo order and already-tried riders — a user never gets the same rider twice in a row), assigns it through the restaurant service's internal endpoint, then simulates straight-line movement: pickup leg at 22 s/km (min 15 s), delivery leg at 26 s/km (min 20 s), emitting `rider:location` to the `user:<id>` room every 3 s. It flips `picked_up` and `delivered` through the existing internal restaurant endpoints.

### Isolation and removal

Every demo entity carries `type: "demo"`; user-created data defaults to `type: "normal"`. Demo restaurants use `ownerId: "demo:<clusterKey>"`, which can never match a real owner lookup, and are `isVerified: true`, so they bypass admin verification queues.

Remove all demo data (mongosh — the database name is `Tomato`):

```js
use Tomato
db.restaurants.deleteMany({ type: "demo" })
db.menuitems.deleteMany({ type: "demo" })
db.riders.deleteMany({ type: "demo" })
db.orders.deleteMany({ type: "demo" })
```

The frontend demo layer (`frontend/src/demo/`) is a separate provider layer over the real API client and can be deleted without touching production flows.

## Environment variables

One Vercel project hosts all seven members on one origin, so set every value there (**Settings → Environment Variables**). `PORT` and `VERCEL` are platform-provided.

| Member | Variables |
| --- | --- |
| frontend | `VITE_AUTH_SERVICE_URL`, `VITE_RESTAURANT_SERVICE_URL`, `VITE_UTILS_SERVICE_URL`, `VITE_RIDER_SERVICE_URL`, `VITE_ADMIN_SERVICE_URL`, `VITE_REALTIME_SERVICE_URL` — all **empty** (same origin), plus `VITE_GOOGLE_CLIENT_ID`, `VITE_INTERNAL_SERVICE_KEY` and the Leaflet/OSM map variables |
| auth | `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| realtime | `INTERNAL_SERVICE_KEY`, `JWT_SECRET` |
| restaurant | `MONGO_URI`, `JWT_SECRET`, `INTERNAL_SERVICE_KEY`, `RABBITMQ_URL`, `PAYMENT_QUEUE`, `RIDER_QUEUE`, `ORDER_READY_QUEUE`, `REALTIME_SERVICE_URL`, `RIDER_SERVICE_URL`, `UTILS_SERVICE`, `OVERPASS_URL` |
| rider | `MONGO_URI`, `JWT_SECRET`, `INTERNAL_SERVICE_KEY`, `RABBITMQ_URL`, `ORDER_READY_QUEUE`, `RIDER_QUEUE`, `REALTIME_SERVICE_URL`, `RESTAURANT_SERVICE`, `UTILS_SERVICE`, `OSRM_ROUTING_URL` |
| utils | `RABBITMQ_URL`, `PAYMENT_QUEUE`, `RESTAURANT_SERVICE_URL`, `INTERNAL_SERVICE_KEY`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, `STRIPE_SECRET_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NOMINATIM_URL`, `NOMINATIM_EMAIL`, `NOMINATIM_USER_AGENT`, `FRONTEND_URL` |
| admin | `MONGO_URI`, `JWT_SECRET`, `DB_NAME` (set to `Tomato`) |

Queue values in use: `PAYMENT_QUEUE=payment_event`, `ORDER_READY_QUEUE=order_ready_event`, `RIDER_QUEUE=rider_event`. `INTERNAL_SERVICE_KEY` must be identical on restaurant, rider, realtime and utils; `JWT_SECRET` identical on auth, restaurant, rider and realtime. auth, restaurant and rider hardcode `dbName: "Tomato"`; admin reads it from `DB_NAME`.

The five cross-service URLs (`REALTIME_SERVICE_URL`, `RIDER_SERVICE_URL`, `RESTAURANT_SERVICE`, `RESTAURANT_SERVICE_URL`, `UTILS_SERVICE`) and `FRONTEND_URL` all take the deployment's own domain — members are not individually public. Leaving `RIDER_SERVICE_URL` unset is not fatal: the rider service backfills cluster riders from the first `ORDER_READY_FOR_RIDER` event instead.

`utils`, `rider` and `restaurant` connect to RabbitMQ at module load and call `process.exit(1)` when it fails, so a missing `RABBITMQ_URL` (or `PAYMENT_QUEUE`) fails every request of that member; auth, restaurant, rider and admin exit on a failed Mongo connection for the same reason.

## Docker images

Complete reference: [docs/docker.md](docs/docker.md). Summary:

`scripts/docker-build-all.sh` builds all six service images in parallel (per-service logs are tailed on failure) and tags them `aniket00736/tomato-<service>:<short-sha>` and `:latest`:

```bash
./scripts/docker-build-all.sh                    # build all six
./scripts/docker-build-all.sh restaurant rider   # build a subset
DOCKER_USER=<user> DOCKERHUB_TOKEN=<token> ./scripts/docker-build-all.sh --push
```

`DOCKER_USER` defaults to `aniket00736` and `IMAGE_PREFIX` (default `tomato-`) controls repository naming. With `--push`, the script logs in with `DOCKERHUB_TOKEN` when provided, otherwise it uses your existing `docker login` session. Pushes run in parallel too.

CI (`.github/workflows/docker.yml`) runs on every push to `main`: it path-filters `services/<name>/**`, builds and pushes only the changed services with GitHub Actions cache (`type=gha`), tagged with the short SHA and `latest`. A manual `workflow_dispatch` run builds all six. Required repository secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.

## Vercel deployment and redeploy checklist

Complete reference: [docs/deployment.md](docs/deployment.md). Summary:

One project, seven members in the root `vercel.json`: `frontend`, `auth`, `realtime`, `restaurant`, `rider`, `utils`, `admin`. Each backend exports its app (realtime exports the HTTP server) as the default export from `src/index.ts`, and the root rewrites are the only public routing: `/socket.io` and `/api/internal|v1/internal` → realtime, `/api/auth` → auth, `/api/restaurant|item|cart|address|order` → restaurant, `/api/rider` → rider, `/api/payment|geocode|upload` → utils, `/api/v1` → admin, everything else → the SPA. A rewrite keeps the original path, so no prefix is stripped and no service or call site changed.

1. Push to `main`; Vercel builds and deploys the whole project (no Docker Hub step).
2. Set the environment variables listed above, including the six empty `VITE_*_SERVICE_URL` values — they are baked in at build time, so a value change needs a redeploy, not just a restart.
3. Delete the old frontend-only Vercel project so it cannot serve the stale build on the domain.
4. Verify `INTERNAL_SERVICE_KEY` on realtime/restaurant/rider/utils and `JWT_SECRET` on auth/restaurant/rider/realtime are identical, and that the cross-service URLs point at the deployment's own domain.
5. Health check: every member answers `GET /` with `ok`.
6. Smoke test after deploy: a deep link renders the SPA, `GET /socket.io/?EIO=4&transport=polling` returns a Socket.IO handshake (not the SPA HTML), an un-keyed `/api/v1/internal/emit` returns 403, and a demo order streams kitchen and delivery updates to the UI.
7. No changes to MongoDB Atlas, RabbitMQ, Stripe or Razorpay configuration.

A WebSocket connection is closed at the maximum function duration (300 s on Hobby), so Socket.IO reconnects periodically instead of holding one connection open indefinitely.

## Local development

- Service ports: auth 3000, realtime 3001, restaurant 3002, rider 3003, utils 3004, admin 3006.
- Run each service with `npm install && npm run build && node dist/index.js` and a local `.env` (tables above); point the cross-service URLs at `http://localhost:<port>`.
- Use a local MongoDB for isolation — the hardcoded `dbName: "Tomato"` means a local mongod is the boundary, never point local runs at the shared RabbitMQ or Atlas production database.
- Frontend: `npm install && npm run dev` inside `frontend/`, with `VITE_*` overrides in `.env.local` for local service URLs.
