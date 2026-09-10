# Deployment

Production topology: six backend services on Render (Docker Hub images under `aniket00736/tomato-<service>`), the frontend static build served at `https://tomato.aniketpandey.website`, MongoDB Atlas as the shared database, RabbitMQ on a VPS.

## Services and URLs

| Service | Render URL | Port |
| --- | --- | --- |
| auth | https://tomato-auth-14q4.onrender.com | 3000 |
| realtime | https://tomato-realtime-y7hj.onrender.com | 3001 |
| restaurant | https://tomato-restaurant-lpwy.onrender.com | 3002 |
| rider | https://tomato-rider-i9eu.onrender.com | 3003 |
| utils | https://tomato-utils-i72q.onrender.com | 3004 |
| admin | https://tomato-admin-a0nr.onrender.com | 3006 |
| frontend | https://tomato.aniketpandey.website | — |

## Shared infrastructure

- **MongoDB Atlas** — `cluster0.h8lwxvz.mongodb.net`, database `Tomato` (hardcoded `dbName` in auth/restaurant/rider; admin reads `DB_NAME`). All services share this database.
- **RabbitMQ** — VPS `68.233.119.207:5672`. Queues: `payment_event`, `order_ready_event`, `rider_event` (names come from env vars; keep the values identical across services).

## Environment variables per Render service

| Service | Variables |
| --- | --- |
| auth | `PORT`, `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL` |
| realtime | `PORT`, `INTERNAL_SERVICE_KEY` |
| restaurant | `PORT`, `MONGO_URI`, `JWT_SECRET`, `RABBITMQ_URL`, `PAYMENT_QUEUE`, `ORDER_READY_QUEUE`, `INTERNAL_SERVICE_KEY`, `REALTIME_SERVICE_URL`, `RIDER_SERVICE_URL` **(new)**, `UTILS_SERVICE` |
| rider | `PORT`, `MONGO_URI`, `JWT_SECRET`, `UTILS_SERVICE`, `INTERNAL_SERVICE_KEY`, `RABBITMQ_URL`, `RESTAURANT_SERVICE`, `ORDER_READY_QUEUE`, `RIDER_QUEUE`, `REALTIME_SERVICE_URL` |
| utils | `PORT`, `RABBITMQ_URL`, `PAYMENT_QUEUE`, `RESTAURANT_SERVICE_URL`, `INTERNAL_SERVICE_KEY`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, `STRIPE_SECRET_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NOMINATIM_URL`, `NOMINATIM_EMAIL`, `NOMINATIM_USER_AGENT`, `FRONTEND_URL` |
| admin | `PORT`, `MONGO_URI`, `JWT_SECRET`, `DB_NAME` |

Cross-service URL values (production):

```
REALTIME_SERVICE_URL=https://tomato-realtime-y7hj.onrender.com
RIDER_SERVICE_URL=https://tomato-rider-i9eu.onrender.com
RESTAURANT_SERVICE=https://tomato-restaurant-lpwy.onrender.com
RESTAURANT_SERVICE_URL=https://tomato-restaurant-lpwy.onrender.com
UTILS_SERVICE=https://tomato-utils-i72q.onrender.com
FRONTEND_URL=https://tomato.aniketpandey.website
```

`INTERNAL_SERVICE_KEY` must be identical on restaurant, rider, realtime and utils — it gates the rider-seed endpoint, the realtime emit API and all internal status calls. `JWT_SECRET` must be identical on auth, restaurant and rider.

## Redeploy checklist

1. Push to `main`. CI (`.github/workflows/docker.yml`) builds and pushes only the changed services to Docker Hub — or run `DOCKER_USER=<user> DOCKERHUB_TOKEN=<token> ./scripts/docker-build-all.sh --push` locally.
2. On Render, redeploy each changed service manually (Render pulls the image by tag; pin the short SHA or use `latest`).
3. **Add `RIDER_SERVICE_URL` to the restaurant service** (value above) — this is a new dependency. Without it, demo restaurants and menus still seed, but demo riders are skipped and demo orders stall at `ready_for_rider`.
4. Verify `INTERNAL_SERVICE_KEY` and `JWT_SECRET` are shared as described above.
5. Health check: every service now answers `GET /` with `ok` — usable as the Render health check path.
6. No changes needed to Atlas, RabbitMQ, Stripe or Razorpay configuration.

## Frontend

`frontend/` builds to a static bundle (`npm run build`). Production env vars (`VITE_*` service URLs, Google client id, Stripe public key, map tile URLs) are baked in at build time — rebuild and redeploy the frontend whenever a service URL changes.
