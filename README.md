# Platform console (super admin)

The operator console for the SalunBD platform. It answers one question the other three front ends
cannot: **what is happening across every shop at once.**

Not to be confused with `salon-owner-dashboard`, which is one shop's own back office. This console
is for the people who run the platform, and every screen is cross-tenant.

## What it does

| Screen | What it answers |
| --- | --- |
| Overview | Platform totals, and which shops need attention |
| Shops | Every tenant, with a vitals glyph showing barbers / services / bookings / reviews |
| Shop detail | One shop's barbers, catalogue, bookings, reviews, payments and addresses; edit and delete |
| Independent barbers | Barbers with no shop — invisible in the tenant roster, but real on the platform |
| Bookings | One day's bookings across every shop |
| Payments | Every transaction, settled and unsettled kept apart |
| Metrics | Metric snapshots per shop, plotted; record new ones |
| Support | Open a ticket by id, read the thread, reply, change status |
| API coverage | Live service reachability, plus what this console can and cannot do |

Nothing here reads from fixtures. If a number is on screen, an endpoint returned it.

## Running it

```bash
npm install
npm run dev
```

`scripts/next-free-port.mjs` picks the first free port from 4100 and **never** hands out 3000–3007 —
those belong to the gateway and the seven backend services, and a dashboard squatting one silently
swallows API traffic from the mobile apps.

The gateway URL comes from `NEXT_PUBLIC_API_URL` (see `.env.local.example`). Every request goes
through the gateway; the console never talks to a service directly.

## Signing in

Requires a `SUPER_ADMIN` account. The console checks the role at sign-in rather than letting each
panel 403 in turn, because `GET /tenants` — the spine of every screen here — is SUPER_ADMIN-only.

## How it is built

- **Next.js 16 (App Router, Turbopack) + Tailwind v4.** No component library, no charting library —
  the charts are a few dozen lines of inline SVG in `components/chart/Chart.tsx`.
- **`lib/api-client.ts`** is the single request path: one shared refresh-and-replay on 401, held as
  a module-level promise so a burst of panels 401-ing together triggers exactly one token exchange.
  Its session key is deliberately distinct from the owner dashboard's, so an operator can be signed
  into both in one browser.
- **`lib/api/*`** is one module per backend surface, typed against the Prisma models.
- **`lib/usePlatform.ts` / `lib/useTenantSweep.ts` / `lib/useSoloBarbers.ts`** hold every fan-out.
  Pages render; they do not orchestrate fetches.

### Why there is so much fanning out

`GET /tenants` is the only call in the entire backend that spans the platform. Every other list
endpoint is scoped to a single shop. So platform-wide figures are assembled in the browser by asking
each shop in turn — pooled six at a time, painting rows as they land, and recording a failed shop as
`null` rather than `0` so a service outage never quietly understates a total.

This is a real constraint, not a stylistic choice, and it is the first thing to fix if the platform grows.

## Design

The chrome is deliberately achromatic — greys, one alarm colour, one all-clear. Every saturated hue
on screen belongs to a tenant (`Tenant.brandColor`), because with forty shops on a roster, colour
that means "this shop" is worth more than colour that means "this is a button".

The one signature device is the **vitals glyph** on each roster row: four bars for barbers, services,
bookings and reviews, on a shared fourth-root scale. A shop that signed up and never furnished itself
reads as a row of flat ticks, so dormant tenants appear as gaps running down the column rather than
as something you have to go looking for.
