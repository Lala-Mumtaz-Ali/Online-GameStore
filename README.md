# GameStore

A full-stack e-commerce game store built with Next.js 16 (App Router), React 19, Prisma, and PostgreSQL (Supabase). Built as a portfolio project to demonstrate end-to-end product engineering: auth, a real storefront, an admin dashboard, shopping/checkout, automated emails, in-app notifications, and an analytics dashboard.

## Tech stack

- **Framework:** Next.js 16 (App Router, Server Actions, Route Handlers)
- **UI:** React 19, Tailwind CSS v4, shadcn/ui + Base UI primitives
- **Database:** PostgreSQL via Supabase, Prisma ORM
- **Auth:** NextAuth v5 — email/password (Credentials) + optional Google OAuth
- **Email:** Resend (transactional email), with a custom domain option
- **Charts:** Recharts, with a validated accessible color palette
- **Validation:** Zod

## Features

**Storefront** — browsing by genre/new/upcoming/top-sellers, game detail pages, category pages, ownership-aware UI (owned games are marked and can't be re-purchased).

**Auth** — registration with email verification, Credentials + Google sign-in, role-based access control (`USER` / `ADMIN`), session-aware navigation.

**Admin dashboard** — CRUD for games and categories, paginated listings, order management, all mutations authorized both at the page layer and inside the data-access layer (defense in depth).

**Shopping** — cart, fake-payment checkout (clearly labeled as simulated, no real payment processing), order history, a purchase library, and preorders for unreleased games with automatic release-day fulfillment.

**Automation** — scheduled jobs (`/api/cron/daily`, `/api/cron/weekly-report`, secured with a bearer secret and wired to Vercel Cron via `vercel.json`) handle: order confirmation emails, abandoned-cart reminders, release-day preorder autopurchase + notifications, and a weekly admin report.

**Notifications** — an in-app notification center (bell icon, unread badge, mark-as-read) mirrors every automated event.

**Analytics** — an admin analytics dashboard (KPI tiles, revenue/orders/signups trends, top sellers, revenue by category) built following an accessible, validated charting methodology rather than default chart styling.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in the values (see comments in the file for what's required vs. optional).
3. Apply the Prisma schema to your database:
   ```bash
   npx prisma migrate deploy
   ```
   > On this machine, `prisma migrate dev` / `db execute` hang indefinitely for reasons never fully diagnosed (isolated to the schema-engine binary specifically — the query engine works fine). If you hit the same issue, generate SQL with `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`, apply it directly against `DIRECT_URL`, and record it in `_prisma_migrations` manually. See the migration files in `prisma/migrations/` for the exact SQL already applied to this schema.
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Project structure notes

- Route groups: `(store)`, `(auth)` for URL-transparent grouping; `admin/` is a real segment (not a group) so admin routes have an explicit prefix.
- `src/data/*.ts` — the data-access layer. Every mutation (and most reads that touch user-specific data) enforces its own authorization inside the DAL, not just at the page/layout level, per Next.js's data-security guidance. Files are guarded with `server-only`.
- `src/proxy.ts` — intentionally a no-op passthrough. Auth is enforced per-page and per-DAL-call, not relied on at the middleware layer.
- Emails are rendered as plain HTML template functions (`src/lib/emailTemplates.ts`) with user-supplied text HTML-escaped before interpolation.

## Known limitations

- No rate limiting on login/register — acceptable for a portfolio project, would need a Redis-backed limiter (e.g. Upstash) before any real-world exposure.
- Admin listings (`games`, `categories`, `orders`) are paginated at 20/page; fine at current scale.
- Fake/simulated payment only — no real payment gateway integration.
