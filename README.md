# 🎮 GameStore — Online Game Store

GameStore is a complete online store for video games, similar to a mini version of Steam or the Epic Games Store. Users can create an account, browse games, add them to a cart, "buy" them (with a simulated payment — no real money involved), and build up a personal game library. Admins get their own dashboard to manage the store and see how it's performing.

This is a **full-stack** project, which means it includes both:

- The **frontend** — everything you see and click on in the browser (pages, buttons, forms).
- The **backend** — everything that happens behind the scenes (saving data to a database, checking passwords, sending emails).

**Live demo:** https://gamestore007.me · **Repo:** https://github.com/Lala-Mumtaz-Ali/Online-GameStore

---

## ✨ What can you do in the app?

### As a regular user
- **Browse the storefront** — explore games by genre, see what's new, upcoming, or top-selling, and open a detail page for each game.
- **Create an account** — sign up with email + password (with email verification) or sign in with Google.
- **Shop** — add games to a cart and check out. Payment is *simulated* (clearly labeled — no real payment is processed), so you can test the full buying flow safely.
- **Own a library** — every purchased game goes into your personal library. The store remembers what you own, so you can't accidentally buy the same game twice.
- **Preorder** — reserve unreleased games. On release day, the system automatically completes the purchase for you.
- **Get notified** — a notification bell in the app shows order confirmations, release-day purchases, and other updates.

### As an admin
- **Manage the store** — add, edit, and delete games and categories from an admin dashboard.
- **Handle orders** — view and manage customer orders.
- **See analytics** — a dashboard with charts showing revenue, orders, signups, top-selling games, and revenue by category.
- **Get reports** — a weekly summary email is sent to the admin automatically.

### Things that happen automatically (no human needed)
Scheduled jobs (called "cron jobs") run in the background to:
- Send order confirmation emails.
- Remind users about items left in their cart.
- Auto-purchase preorders on release day and notify the buyer.
- Email a weekly report to the admin.

---

## 🛠️ Technologies used (and what each one does)

| Technology | What it is | What we use it for |
|---|---|---|
| **[Next.js 16](https://nextjs.org)** | A framework built on top of React | The foundation of the whole app — it handles pages, routing (which URL shows which page), and server-side code, all in one project |
| **[React 19](https://react.dev)** | A library for building user interfaces | Building every page and interactive component (buttons, forms, the cart, etc.) |
| **[TypeScript](https://www.typescriptlang.org)** | JavaScript with types added | Catching bugs while writing code instead of discovering them in the browser |
| **[PostgreSQL](https://www.postgresql.org)** (hosted on [Supabase](https://supabase.com)) | A database | Storing everything permanent: users, games, orders, carts, notifications |
| **[Prisma](https://www.prisma.io)** | An ORM (a tool that lets code talk to the database) | Reading and writing database records with TypeScript instead of raw SQL |
| **[NextAuth v5](https://authjs.dev)** | An authentication library | Sign-up, login (email/password + Google), and keeping users logged in securely |
| **[Tailwind CSS v4](https://tailwindcss.com)** | A CSS framework | Styling the app with small utility classes instead of writing custom CSS files |
| **[shadcn/ui](https://ui.shadcn.com)** | A collection of pre-built UI components | Nice-looking buttons, dialogs, forms, and menus without building them from scratch |
| **[Zod](https://zod.dev)** | A validation library | Checking that user input (like registration forms) is valid before trusting it |
| **[Resend](https://resend.com)** | An email service | Sending real emails: verification links, order confirmations, weekly reports |
| **[Recharts](https://recharts.org)** | A charting library | Drawing the graphs on the admin analytics dashboard |
| **[Vercel](https://vercel.com)** | A hosting platform | Running the deployed app and triggering the scheduled background jobs |
| **[Vitest](https://vitest.dev)** | A unit-test runner | Testing pure logic — pagination math, date bucketing, email escaping, auth guards |
| **[Playwright](https://playwright.dev)** | A browser-automation test tool | End-to-end tests that drive a real browser against a real build |

---

## 🚀 Running the project on your computer

**Prerequisites:** [Node.js](https://nodejs.org) (v20 or newer) and a PostgreSQL database (a free [Supabase](https://supabase.com) project works great).

**1. Get the code and install dependencies**

```bash
git clone https://github.com/Lala-Mumtaz-Ali/Online-GameStore.git
cd Online-GameStore
npm install
```

**2. Set up environment variables**

Copy `.env.example` to `.env` and fill in the values (database connection string, auth secret, email API key, etc.). The comments inside the file explain which values are required and which are optional.

**3. Create the database tables**

```bash
npx prisma migrate deploy
```

> **Troubleshooting:** on some machines `prisma migrate dev` hangs indefinitely (an issue with Prisma's schema-engine binary). If that happens to you, generate the SQL manually with `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`, run it directly against your database (`DIRECT_URL`), and record it in the `_prisma_migrations` table. The files in `prisma/migrations/` contain the exact SQL for this schema.

**4. Seed the database**

```bash
npm run db:seed
```

This creates the categories and the game catalogue. If you also set `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` in your `.env`, it creates an admin account so you can open `/admin` —
otherwise it skips that step and tells you so. There is deliberately **no default admin password**:
a hardcoded credential in a public repo becomes a real vulnerability the moment someone deploys it.

**5. Start the app**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser — you should see the storefront. 🎉

---

## 🧪 Tests

| Command | What it does |
|---|---|
| `npm test` | Unit tests ([Vitest](https://vitest.dev)) — pure logic, no network, no database |
| `npm run test:watch` | The same suite in watch mode |
| `npm run test:coverage` | Unit tests with a V8 coverage report |
| `npm run test:e2e` | End-to-end browser tests ([Playwright](https://playwright.dev)) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

**Unit tests mock Prisma rather than hitting a database.** The only database this project has is a
remote Supabase instance holding live data, so a unit suite that connected to it would be slow,
non-deterministic, and destructive. Instead the suite targets logic that is genuinely worth pinning:
pagination and URL-building math, date bucketing for the analytics charts, HTML escaping in outbound
email, and the authorization guards.

One of those tests is the architectural one: it asserts that calling `deleteGame()` as a non-admin
rejects **and never reaches Prisma** — an executable proof that authorization lives in the data layer,
not in the pages that happen to call it.

**End-to-end tests run against a real database and a real production build.** In CI they get a
disposable Postgres service container, which is migrated and seeded from scratch on every run. To run
them locally you need a database you are willing to write to:

```bash
npm run build
npm run db:seed
npm run test:e2e
```

> ⚠️ Never point the E2E suite at your production database — it registers accounts and writes data.

A pre-commit hook runs `typecheck`, `lint`, and the unit tests. Playwright deliberately stays out of
that hook: a hook slow enough to be annoying just gets bypassed with `--no-verify`.

Both suites also run in GitHub Actions on every push and pull request (`.github/workflows/ci.yml`).

---

## 📁 How the code is organized

```
src/
├── app/            # All pages and routes (Next.js App Router)
│   ├── (store)/    # Customer-facing pages: home, games, cart, checkout, library
│   ├── (auth)/     # Login, register, email verification pages
│   ├── admin/      # Admin dashboard pages (games, orders, analytics)
│   └── api/        # API endpoints, including the scheduled cron jobs
├── actions/        # Server Actions — functions the frontend calls to change data
├── components/     # Reusable UI pieces (buttons, cards, navbar, etc.)
├── data/           # Data-access layer — the ONLY place that talks to the database
├── lib/            # Shared helpers (email templates, pagination, date series)
├── services/       # Business logic (e.g., what happens during checkout)
├── test/           # Test doubles (the Prisma mock, the server-only stub)
└── auth.ts         # NextAuth configuration
prisma/
├── schema.prisma   # The database blueprint: every table and its columns
├── seed.ts         # Fills a fresh database with categories, games, and an admin
└── migrations/     # SQL files that build the database step by step
e2e/                # Playwright end-to-end specs
```

A few design decisions worth knowing about:

- **Security lives in the data layer.** Every function in `src/data/` that changes data checks *itself* whether the current user is allowed to do it — even if the page already checked. This "defense in depth" approach means a bug in one page can't accidentally expose admin actions.
- **Route groups** like `(store)` and `(auth)` organize files without affecting URLs, while `admin/` is a real URL segment so all admin pages clearly live under `/admin`.
- **Cron endpoints are protected** with a secret token, so random visitors can't trigger the background jobs.
- **Emails escape user input** before inserting it into HTML, preventing injection attacks.

---

## ⚠️ Known limitations

This is a portfolio project, so a few things are intentionally simplified:

- **No real payments** — checkout is simulated. Integrating a real gateway (like Stripe) would be the next step for a production store.
- **No rate limiting** on login/register — a real app would add this (e.g., with Upstash Redis) to block brute-force attacks.
- **Simple pagination** — admin lists show 20 items per page, which is fine at this scale.

---

## 📄 License

This project was built for learning and portfolio purposes. Feel free to explore the code and learn from it!
