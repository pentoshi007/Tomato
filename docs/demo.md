# Demo Mode — How It Works

There are two distinct demo concepts in Tomato:

1. **Backend demo seeding** — real restaurants, real orders, real payments, automated fulfillment. The main feature; documented here and in [seeding.md](seeding.md).
2. **Frontend demo layer** (`frontend/src/demo/`) — a client-side "guided tour" with simulated data and simulated payments, entered via the Demo button. Summarized at the end.

## Backend demo order lifecycle

A demo order is a completely real order placed at a demo restaurant. The user pays for real (Razorpay or Stripe) and gets a real order id; everything after payment runs automatically.

```
user pays (Razorpay/Stripe, real)
  → utils service verifies payment → PAYMENT_SUCCESS on payment_event queue
  → restaurant service marks order paid (normal flow, order.type = "demo")
  → kitchen automation: placed → accepted (12s) → preparing (18s) → ready_for_rider (20s)
  → ORDER_READY_FOR_RIDER on order_ready_event queue (with demo flag + locations)
  → rider service claims a demo rider → assigns via internal endpoint
  → movement simulation: rider:location pings every 3s to user:<id>
  → picked_up → delivered (via internal restaurant endpoints)
```

### Kitchen automation (restaurant service)

`services/restaurant/src/config/demoKitchen.ts` runs the timeline in-process — no extra infrastructure:

| Transition | Delay |
| --- | --- |
| placed → accepted | 12 s |
| accepted → preparing | 18 s |
| preparing → ready_for_rider | 20 s |

Each step is a guarded `findOneAndUpdate({ _id, status: <from>, paymentStatus: "paid" })`, so replays, races and restarts are no-ops. Every transition emits `order:update` to the `user:<id>` room through the realtime service, exactly like a real restaurant would. On boot, `resumeDemoKitchens()` resumes kitchens interrupted by a restart. The trigger is the payment consumer: when a paid order has `type: "demo"`, the kitchen starts.

### Delivery automation (rider service)

`services/rider/src/config/orderReady.consumer.ts` consumes `ORDER_READY_FOR_RIDER`. Demo events carry `demo: true`, `demoClusterKey`, and the restaurant + delivery coordinates.

1. **Rider claim** — atomic `findOneAndUpdate` claiming the least-recently-active demo rider (`lastActiveAt` ascending) scoped to the order's cluster, excluding:
   - the rider who delivered this **user's previous demo order** (per-user rotation — a user never gets the same rider twice in a row), queried via `GET /api/order/demo/previous-rider` on the restaurant service
   - riders already tried for this order (retry loop on assignment failure)
2. **Assignment** — `PUT /api/order/assign/rider` on the restaurant service (internal key), same endpoint real riders go through.
3. **Movement** — straight-line interpolation from the rider's position to the restaurant, then restaurant to the delivery address:
   - pickup leg: 22 s/km, minimum 15 s
   - delivery leg: 26 s/km, minimum 20 s
   - `rider:location` emitted to `user:<userId>` every 3 s — the OrderPage map marker moves
4. **Completion** — `picked_up` at the restaurant, `delivered` at the address, both through `PUT /api/order/update/status/rider` (internal).

Real orders are unaffected: the real-rider notification branch filters `type: "normal"`, and demo riders are `isAvailable: false` so they never appear in real offer lists.

### What the user sees

Homepage (empty area) → 9 demo kitchens with images and distances → menu → cart → checkout with a saved address → real Razorpay/Stripe payment → "Order placed!" → order tracking page where the status advances on its own and the rider marker moves on the map → order shows Delivered on the Orders page.

## Payments are real

Demo-restaurant orders use the same Razorpay/Stripe flow as any other order — the user's explicit requirement. In production this means real money is charged for demo-restaurant orders. (During local E2E the Stripe test key was used with card 4242….)

## Frontend demo layer (guided tour)

`frontend/src/demo/` is a client-side layer installed by `DemoProvider`:

- Entry is the **Demo button** in the navbar only — nothing auto-opens (the old empty-state auto-invite was removed).
- Personas: customer, seller, rider (admin persona removed).
- Inside it, API calls and the socket are intercepted with simulated data; checkout uses a themed simulated Razorpay/Stripe sheet (no backend calls, no money).
- Exiting restores the real session untouched; the whole layer is deletable without affecting production flows.

## Residuals

- Demo orders in production charge real money (by design).
- Restaurant/dish/rider images are hotlinked from public CDNs (TheMealDB, Wikimedia Commons, Unsplash, randomuser.me) — all verified reachable; if a CDN rots, images break but the flow keeps working.
- Demo clusters accumulate in the shared `Tomato` database (one per ~1.1 km grid cell where a user triggered seeding); removal queries in [seeding.md](seeding.md).
