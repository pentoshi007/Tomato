# Tomato

Full-stack food delivery platform: a React SPA backed by six Express microservices, MongoDB, RabbitMQ, Socket.IO realtime and Razorpay/Stripe payments.

## Architecture

| Service | Default port | Responsibility |
| --- | --- | --- |
| `frontend` | 5173 | React 19 + Vite + TypeScript + Tailwind CSS 4 single-page app |
| `services/auth` | 3000 | Google OAuth login, JWT issuing and verification |
| `services/realtime` | 3001 | Socket.IO hub with `user:<id>` / `restaurant:<id>` rooms, internal emit API |
| `services/restaurant` | 3002 | Restaurants, menus, cart, addresses, orders, payment consumer, demo kitchen automation |
| `services/rider` | 3003 | Rider profiles, order offers, delivery status updates, demo delivery automation |
| `services/utils` | 3004 | Razorpay/Stripe payments, Cloudinary uploads, Nominatim geocoding |
| `services/admin` | 3006 | Verification queues for restaurants and riders |

Shared infrastructure: MongoDB (database `Tomato`) and RabbitMQ (queues `payment_event`, `order_ready_event`, `rider_event`).

## Local development

Each service is standalone — install and run it individually:

```bash
cd services/<name>
npm install
npm run build
node dist/index.js
```

Create a `.env` per service (variable list in [notes.md](notes.md)). The frontend is a Vite app:

```bash
cd frontend
npm install
npm run dev
```

## Docker

```bash
./scripts/docker-build-all.sh                    # build all six images in parallel
./scripts/docker-build-all.sh restaurant rider   # build a subset
DOCKER_USER=<user> DOCKERHUB_TOKEN=<token> ./scripts/docker-build-all.sh --push
```

Images are tagged `aniket00736/tomato-<service>:<short-sha>` and `:latest`. CI (`.github/workflows/docker.yml`) builds and pushes only the services changed on every push to `main`, using the `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` repository secrets. A manual `workflow_dispatch` run builds all six.

## Deployment

All seven members — the SPA and the six Express services — deploy as a **single Vercel project** driven by the root `vercel.json` (`services` model). Each backend exposes itself through the public route prefixes in that file, the SPA keeps its catch-all, and everything shares one domain, so no service URL has to be configured in the frontend. See [docs/deployment.md](docs/deployment.md) for the env matrix, routing table and checklist.

## Documentation

- [docs/seeding.md](docs/seeding.md) — demo seeding: trigger conditions, cluster identity, catalog, addresses, riders, removal
- [docs/demo.md](docs/demo.md) — how demo mode works: full order lifecycle, kitchen and delivery automation, rider rotation
- [docs/docker.md](docs/docker.md) — Docker images, build/push script, CI workflow
- [docs/deployment.md](docs/deployment.md) — Vercel deployment (single project, services model), routing table, environment variables, redeploy checklist
- [notes.md](notes.md) — engineering-notes digest of the same
