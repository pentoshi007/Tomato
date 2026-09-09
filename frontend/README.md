# Tomato — Frontend

Customer, seller, rider and admin web client for Tomato, a food-delivery platform built as a microservices hobby project.

## Stack

- **React 19 + TypeScript + Vite** (rolldown)
- **Tailwind CSS v4** with a hand-rolled neo-brutalist design system (`src/index.css`)
- **React Router v7** with route-level code splitting
- **Leaflet + OSRM** for live delivery maps (lazy-loaded)
- **socket.io-client** for realtime order updates
- **Razorpay / Stripe** checkout
- Hand-authored SVG illustration set (`src/components/ui/illustrations.tsx`)

## Design system

Everything shares one token set defined in `src/index.css`:

- Solid colors only — no gradients. Cream paper background, ink outlines, hard offset shadows.
- Composable utilities: `btn-primary`, `btn-secondary`, `card`, `chip`, `sticker`, `input`, `label`, `skeleton`.
- Display font: Bricolage Grotesque. Body: Outfit.
- All animations are transform/opacity-only and respect `prefers-reduced-motion`.

## Develop

```bash
bun install
cp .env.example .env   # fill in your service URLs + keys
bun run dev
```

## Build

```bash
bun run build
```

Pages, Leaflet maps and dashboards are split into lazy chunks; restaurant/menu imagery is served through Cloudinary auto-optimization (`f_auto,q_auto,w_*`).
