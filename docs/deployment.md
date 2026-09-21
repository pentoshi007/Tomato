# Deployment

Production topology: **one Vercel project** built from the root `vercel.json` using Vercel's `services` model. The Vite SPA and all six Express backends are members of the same deployment and share one domain, so the browser talks to `/api/...` on the site origin and the services talk to each other over the same origin.

MongoDB Atlas and RabbitMQ (VPS) remain external. The previous Render deployment (one Docker service per backend) is retired.

## Members

| Member | Root directory | Local port | Exposed at | Responsibility |
| --- | --- | --- | --- | --- |
| `frontend` | `frontend/` | 5173 | `/` (catch-all, last) | React 19 + Vite + TypeScript + Tailwind CSS 4 SPA |
| `auth` | `services/auth/` | 3000 | `/api/auth/...` | Google OAuth login, JWT issuing and verification |
| `realtime` | `services/realtime/` | 3001 | `/socket.io`, `/api/internal/...`, `/api/v1/internal/...` | Socket.IO hub with `user:<id>` / `restaurant:<id>` rooms, internal emit API |
| `restaurant` | `services/restaurant/` | 3002 | `/api/restaurant/...`, `/api/item/...`, `/api/cart/...`, `/api/address/...`, `/api/order/...` | Restaurants, menus, cart, addresses, orders, payment consumer, demo kitchen automation |
| `rider` | `services/rider/` | 3003 | `/api/rider/...` | Rider profiles, order offers, delivery status updates, demo delivery automation |
| `utils` | `services/utils/` | 3004 | `/api/payment/...`, `/api/geocode/...`, `/api/upload` | Razorpay/Stripe payments, Cloudinary uploads, Nominatim geocoding |
| `admin` | `services/admin/` | 3006 | `/api/v1/...` | Verification queues for restaurants and riders |

Each member is internally unreachable: a member is only exposed through a top-level rewrite in `vercel.json`. Rewrites are matched in order, so the SPA catch-all stays last.

## Routing

The 19 rewrites in the root `vercel.json`, in order:

| # | Source | Target |
| --- | --- | --- |
| 1 | `/socket.io` | `realtime` |
| 2 | `/socket.io/:path*` | `realtime` |
| 3 | `/api/internal` | `realtime` |
| 4 | `/api/internal/:path*` | `realtime` |
| 5 | `/api/auth/:path*` | `auth` |
| 6 | `/api/restaurant/:path*` | `restaurant` |
| 7 | `/api/item/:path*` | `restaurant` |
| 8 | `/api/cart/:path*` | `restaurant` |
| 9 | `/api/address/:path*` | `restaurant` |
| 10 | `/api/order/:path*` | `restaurant` |
| 11 | `/api/rider/:path*` | `rider` |
| 12 | `/api/payment/:path*` | `utils` |
| 13 | `/api/geocode/:path*` | `utils` |
| 14 | `/api/upload` | `utils` |
| 15 | `/api/upload/:path*` | `utils` |
| 16 | `/api/v1/internal` | `realtime` |
| 17 | `/api/v1/internal/:path*` | `realtime` |
| 18 | `/api/v1/:path*` | `admin` |
| 19 | `/(.*)` | `frontend` |

Routing rules that make this work:

- **A rewrite target keeps the original request path.** A request to `/api/order/current/rider` reaches `restaurant` as `/api/order/current/rider`, which is exactly how the service mounts its routers. No prefix stripping exists anywhere in the code, and none is needed.
- **`/api/v1/internal/*` must precede `/api/v1/*`** — the restaurant service emits order updates to `${REALTIME_SERVICE_URL}/api/v1/internal/emit`, which is the same route as `/api/internal/emit` on the realtime member. Ordering `admin` first would shadow it.
- **`/socket.io` is already correct.** The realtime member attaches Socket.IO to the default path, and the frontend connects with the default path, so both sides use `/socket.io` with zero client or server changes.
- **`services/<name>/src/index.ts` is the entry.** Each backend exports its app (or the HTTP server for realtime) as the default export; Vercel calls that export per request. If a member is not detected as a server, add `"entrypoint": "src/index.ts"` to that member in `vercel.json`.

## Shared infrastructure

- **MongoDB Atlas** — `cluster0.h8lwxvz.mongodb.net`, database `Tomato` (hardcoded `dbName` in auth/restaurant/rider; `admin` reads `DB_NAME`). All services share this database.
- **RabbitMQ** — VPS `68.233.119.207:5672`. Queues: `payment_event`, `order_ready_event`, `rider_event` (names come from env vars; keep the values identical across services).

## Environment variables per member

Set these in the Vercel project (**Settings → Environment Variables**, scoped to the environments you deploy) before the first deployment. `PORT` and `VERCEL` are platform-provided and must not be set; the guard is `if (process.env.VERCEL)` in each backend.

| Member | Variables |
| --- | --- |
| auth | `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| realtime | `INTERNAL_SERVICE_KEY`, `JWT_SECRET` |
| restaurant | `MONGO_URI`, `JWT_SECRET`, `INTERNAL_SERVICE_KEY`, `RABBITMQ_URL`, `PAYMENT_QUEUE`, `RIDER_QUEUE`, `ORDER_READY_QUEUE`, `REALTIME_SERVICE_URL`, `RIDER_SERVICE_URL`, `UTILS_SERVICE`, `OVERPASS_URL` |
| rider | `MONGO_URI`, `JWT_SECRET`, `INTERNAL_SERVICE_KEY`, `RABBITMQ_URL`, `ORDER_READY_QUEUE`, `RIDER_QUEUE`, `REALTIME_SERVICE_URL`, `RESTAURANT_SERVICE`, `UTILS_SERVICE`, `OSRM_ROUTING_URL` |
| utils | `RABBITMQ_URL`, `PAYMENT_QUEUE`, `RESTAURANT_SERVICE_URL`, `INTERNAL_SERVICE_KEY`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, `STRIPE_SECRET_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NOMINATIM_URL`, `NOMINATIM_EMAIL`, `NOMINATIM_USER_AGENT`, `FRONTEND_URL` |
| admin | `MONGO_URI`, `JWT_SECRET`, `DB_NAME` (set to `Tomato`) |

Required values that are not secrets:

```
# every member shares the deployment domain; use the project's production URL
REALTIME_SERVICE_URL=https://<project>.vercel.app
RIDER_SERVICE_URL=https://<project>.vercel.app
RESTAURANT_SERVICE=https://<project>.vercel.app
RESTAURANT_SERVICE_URL=https://<project>.vercel.app
UTILS_SERVICE=https://<project>.vercel.app
FRONTEND_URL=https://<project>.vercel.app

PAYMENT_QUEUE=payment_event
ORDER_READY_QUEUE=order_ready_event
RIDER_QUEUE=rider_event
DB_NAME=Tomato
```

- `INTERNAL_SERVICE_KEY` must be identical on realtime, restaurant, rider and utils — it gates the realtime emit API, the rider-seed endpoint and the internal status calls.
- `JWT_SECRET` must be identical on auth, restaurant, rider and realtime.
- The five cross-service URLs point at the deployment domain, not at individual members: members are not individually public, and same-origin calls are covered by the services' `origin: "*"` CORS.
- Omitting `RIDER_SERVICE_URL` is not fatal but degrades demo mode — demo riders are then only backfilled from the first `ORDER_READY_FOR_RIDER` event.

### Frontend build variables

The SPA is built at deploy time, so the six service URLs must be **empty** — an empty value resolves to the same origin, which is how the single deployment routes every service:

```
VITE_AUTH_SERVICE_URL=
VITE_RESTAURANT_SERVICE_URL=
VITE_UTILS_SERVICE_URL=
VITE_RIDER_SERVICE_URL=
VITE_ADMIN_SERVICE_URL=
VITE_REALTIME_SERVICE_URL=
```

`VITE_GOOGLE_CLIENT_ID`, `VITE_INTERNAL_SERVICE_KEY` and the Leaflet/OSM map variables are also read at build time (`frontend/.env.example` lists them all). Do not set a `VITE_REALTIME_SERVICE_URL` to the site URL: the socket client is passed `undefined` when the value is empty, and an explicit empty string is not equivalent. If you ever set it to a real URL, re-verify the socket connection in the browser.

## Deploying

1. Import the repository into Vercel as a **single project** with the **root directory set to the repository root** (not `frontend/`). `vercel.json` at that root defines all seven members.
2. Delete the old frontend-only Vercel project so it cannot serve the stale build and dominate the domain.
3. Add the environment variables above — per member where the names differ, and the six empty frontend build variables. Every variable a backend reads must exist, or that member fails at request time.
4. Deploy. Vercel installs and builds each member from its own root directory with the lockfiles that are committed (`frontend/package-lock.json` is committed and current).
5. Point the domain's DNS at the new project; `FRONTEND_URL` and the cross-service URLs follow the production URL.
6. Verify with the checklist below.

## Verification checklist

1. Each backend answers `GET /` with `ok` when reached directly (local or self-managed) — that is the health route every service defines. Through the deployment the same members are proven by prefix: `GET /api/rider/...` returns the rider service's own response instead of the SPA HTML, and a bare `/` is the SPA catch-all, not a backend.
2. `GET /api/restaurant/nearby` without a session returns the auth error (route reached the restaurant member), and the SPA still loads at `/` and at a deep link such as `/orders`.
3. Socket handshake: `GET /socket.io/?EIO=4&transport=polling` returns a Socket.IO handshake (sid) rather than the SPA HTML, and the browser console shows a live `websocket` connection.
4. `GET /api/v1/internal/emit` without the `x-internal-key` header returns 403 (realtime member, not admin).
5. Place a demo order and confirm the kitchen and delivery updates stream into the UI — this exercises payment → RabbitMQ → restaurant → `ORDER_READY_FOR_RIDER` → rider → realtime.
6. Confirm the deployed frontend bundle contains no Render service URL (`VITE_*` values are baked in at build time).

## Operational caveats

- **WebSocket lifetime.** A WebSocket connection is pinned to one function instance and closed at the maximum function duration (300 s on Hobby, not raisable). Socket.IO reconnects automatically, but long-lived realtime sessions are repeatedly re-established.
- **A missing `RABBITMQ_URL` kills the member.** `restaurant`, `rider` and `utils` connect to RabbitMQ while loading, and the connection code calls `process.exit(1)` on failure — the member then fails every request instead of degrading.
- **A failing Mongo connection kills the member.** auth, restaurant, rider and admin exit the process when the database connection fails.
- **Services are public-beta.** A member only receives traffic through the rewrites in `vercel.json`; adding a new public prefix requires a new rewrite, and the SPA catch-all must stay last.
- **No prefix stripping anywhere.** If a service is ever exposed under a different prefix than the one its routers mount, the service must change, not the routing.

## Docker (self-managed alternative)

The Docker images and the build/push script are still in the repository and still work for running the stack yourself — see [docs/docker.md](docs/docker.md). CI (`.github/workflows/docker.yml`) builds and pushes changed services to Docker Hub; it is no longer part of the production path now that Render is retired.
