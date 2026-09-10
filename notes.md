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

| Service | Variables |
| --- | --- |
| auth | `PORT`, `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL` |
| realtime | `PORT`, `INTERNAL_SERVICE_KEY` |
| restaurant | `PORT`, `MONGO_URI`, `JWT_SECRET`, `RABBITMQ_URL`, `PAYMENT_QUEUE`, `ORDER_READY_QUEUE`, `INTERNAL_SERVICE_KEY`, `REALTIME_SERVICE_URL`, `RIDER_SERVICE_URL` **(new)**, `UTILS_SERVICE` |
| rider | `PORT`, `MONGO_URI`, `RABBITMQ_URL`, `ORDER_READY_QUEUE`, `RIDER_QUEUE`, `INTERNAL_SERVICE_KEY`, `REALTIME_SERVICE_URL`, `RESTAURANT_SERVICE` |
| utils | `PORT`, `RABBITMQ_URL`, `PAYMENT_QUEUE`, `RESTAURANT_SERVICE_URL`, `INTERNAL_SERVICE_KEY`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, `STRIPE_SECRET_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NOMINATIM_URL`, `NOMINATIM_EMAIL`, `NOMINATIM_USER_AGENT` |
| admin | `PORT`, `MONGO_URI`, `DB_NAME` (set to `Tomato`) |

Queue values in use: `PAYMENT_QUEUE=payment_event`, `ORDER_READY_QUEUE=order_ready_event`, `RIDER_QUEUE=rider_event`. `INTERNAL_SERVICE_KEY` must be identical on restaurant, rider, realtime and utils. auth, restaurant and rider hardcode `dbName: "Tomato"`; admin reads it from `DB_NAME`.

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

## Render redeploy checklist

Complete reference: [docs/deployment.md](docs/deployment.md). Summary:

1. Push to `main` (or run the workflow manually) so the images land on Docker Hub.
2. On Render, redeploy each service manually — the new images are pulled by tag (`:latest` or the pinned short SHA).
3. **Add `RIDER_SERVICE_URL` to the restaurant service** on Render, pointing at the rider service's Render URL. Recommended for prompt rider seeding; if it's missing or the rider service is cold, the rider service backfills cluster riders on the first demo `ORDER_READY_FOR_RIDER` event, so demo orders still complete.
4. Verify `INTERNAL_SERVICE_KEY` is identical on restaurant, rider, realtime and utils — the rider-seed endpoint and all internal emit/status calls are gated on it.
5. All six services now answer `GET /` with `ok` — usable as a Render health check path.
6. No changes to MongoDB Atlas, RabbitMQ, Stripe or Razorpay configuration.

## Local development

- Service ports: auth 3000, realtime 3001, restaurant 3002, rider 3003, utils 3004, admin 3006.
- Run each service with `npm install && npm run build && node dist/index.js` and a local `.env` (tables above); point the cross-service URLs at `http://localhost:<port>`.
- Use a local MongoDB for isolation — the hardcoded `dbName: "Tomato"` means a local mongod is the boundary, never point local runs at the shared RabbitMQ or Atlas production database.
- Frontend: `npm install && npm run dev` inside `frontend/`, with `VITE_*` overrides in `.env.local` for local service URLs.
