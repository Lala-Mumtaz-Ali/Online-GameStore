# 🎮 GameStore — Online Game Store

GameStore is a complete online store for video games, similar to a mini version of Steam or the Epic Games Store. Users can create an account, browse games, add them to a cart, "buy" them (with a simulated payment — no real money involved), and build up a personal game library. Admins get their own dashboard to manage the store and see how it's performing.

This is a **full-stack** project, which means it includes both:

- The **frontend** — everything you see and click on in the browser (pages, buttons, forms).
- The **backend** — everything that happens behind the scenes (saving data to a database, checking passwords, sending emails).

**Live demo:** https://gamestore007.me · **Repo:** https://github.com/Lala-Mumtaz-Ali/Online-GameStore

---

## ✨ What can you do in the app?

### As a regular user

- **Browse the storefront** — explore ~120 real games across 12 genres, see what's new, upcoming, or top-selling, and open a detail page for each game.
- **Search and filter the catalogue** — search by title from the navbar, filter by genre, and sort by title, price, or release date. Everything lives in the URL, so any view is shareable and bookmarkable.
- **Read a proper store page** — each game has cover art, developer and publisher, Metacritic score, review count, supported platforms, playable **trailers**, a **screenshot gallery** with a lightbox, the full store description, and feature tags (Single-player, Co-op, Controller support…).
- **Create an account** — sign up with email + password (with email verification) or sign in with Google.
- **Reset a forgotten password** — request a link by email, then set a new password. Links are single-use and expire after an hour.
- **Manage your account** — change your display name, change (or set) your password, resend the verification email, and see your role, join date, and order count.
- **Shop** — add games to a cart and check out. Payment is _simulated_ (clearly labeled — no real payment is processed), so you can test the full buying flow safely.
- **Own a library** — every purchased game goes into your personal library. The store remembers what you own, so you can't accidentally buy the same game twice.
- **Preorder** — reserve unreleased games. On release day, the system automatically completes the purchase for you.
- **Get notified** — a notification bell in the app shows order confirmations, release-day purchases, and other updates.

### As an admin

- **Manage the store** — add, edit, and delete games and categories from an admin dashboard.
- **Handle orders** — view and manage customer orders.
- **Manage users** — search and filter accounts by name, email, or role, and promote or demote admins. Previously the only way to create an admin was to edit the database by hand.
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

| Technology                                                                                | What it is                                          | What we use it for                                                                                                                 |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **[Next.js 16](https://nextjs.org)**                                                      | A framework built on top of React                   | The foundation of the whole app — it handles pages, routing (which URL shows which page), and server-side code, all in one project |
| **[React 19](https://react.dev)**                                                         | A library for building user interfaces              | Building every page and interactive component (buttons, forms, the cart, etc.)                                                     |
| **[TypeScript](https://www.typescriptlang.org)**                                          | JavaScript with types added                         | Catching bugs while writing code instead of discovering them in the browser                                                        |
| **[PostgreSQL](https://www.postgresql.org)** (hosted on [Supabase](https://supabase.com)) | A database                                          | Storing everything permanent: users, games, orders, carts, notifications                                                           |
| **[Prisma](https://www.prisma.io)**                                                       | An ORM (a tool that lets code talk to the database) | Reading and writing database records with TypeScript instead of raw SQL                                                            |
| **[NextAuth v5](https://authjs.dev)**                                                     | An authentication library                           | Sign-up, login (email/password + Google), and keeping users logged in securely                                                     |
| **[Tailwind CSS v4](https://tailwindcss.com)**                                            | A CSS framework                                     | Styling the app with small utility classes instead of writing custom CSS files                                                     |
| **[shadcn/ui](https://ui.shadcn.com)**                                                    | A collection of pre-built UI components             | Nice-looking buttons, dialogs, forms, and menus without building them from scratch                                                 |
| **[Zod](https://zod.dev)**                                                                | A validation library                                | Checking that user input (like registration forms) is valid before trusting it                                                     |
| **[Resend](https://resend.com)**                                                          | An email service                                    | Sending real emails: verification links, order confirmations, weekly reports                                                       |
| **[Recharts](https://recharts.org)**                                                      | A charting library                                  | Drawing the graphs on the admin analytics dashboard                                                                                |
| **[Vercel](https://vercel.com)**                                                          | A hosting platform                                  | Running the deployed app and triggering the scheduled background jobs                                                              |
| **[Vitest](https://vitest.dev)**                                                          | A unit-test runner                                  | Testing pure logic — pagination math, date bucketing, email escaping, auth guards                                                  |
| **[Playwright](https://playwright.dev)**                                                  | A browser-automation test tool                      | End-to-end tests that drive a real browser against a real build                                                                    |
| **[hls.js](https://github.com/video-dev/hls.js)**                                         | A streaming-video player                            | Playing game trailers, which Steam serves only as adaptive HLS/DASH streams rather than plain MP4 files                            |
| **[sanitize-html](https://github.com/apostrophecms/sanitize-html)**                       | An HTML sanitiser                                   | Stripping anything dangerous out of imported store descriptions before they are rendered                                           |
| **[Steam Web API](https://store.steampowered.com/api/appdetails)**                        | Valve's public store API                            | Importing the catalogue: genres, feature tags, prices, screenshots, trailers, and review scores                                    |

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

<details>
<summary><strong>Troubleshooting: <code>prisma migrate dev</code> hangs</strong></summary>

On some machines Prisma's schema-engine binary hangs indefinitely. `migrate dev` and
`migrate resolve` are both affected; `migrate diff`, `db execute`, and `migrate deploy` are not.
This is the workaround used to author the migrations in this repo:

```bash
# 1. Generate the delta between the live database and the schema.
npx prisma migrate diff \
  --from-url "$DIRECT_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/<timestamp>_<name>/migration.sql

# 2. Apply it (db execute does not use the schema engine).
npx prisma db execute \
  --file prisma/migrations/<timestamp>_<name>/migration.sql \
  --url "$DIRECT_URL"

# 3. Record it as applied. `migrate resolve --applied <name>` is the supported
#    way, but it hangs too, so insert the row directly. The checksum is the
#    SHA-256 of migration.sql (`sha256sum` on the file).
#    -> INSERT INTO "_prisma_migrations" (id, checksum, finished_at,
#         migration_name, started_at, applied_steps_count)
#       VALUES (gen_random_uuid()::text, '<sha256>', now(), '<name>', now(), 1);

# 4.
npx prisma generate
```

`.gitattributes` pins `*.sql` to LF line endings, because a CRLF checkout would change each
migration's checksum and `migrate deploy` would then refuse to run against an existing database.

A fresh database (a clone, or the CI job) does not need any of this — `npx prisma migrate deploy`
applies everything in `prisma/migrations/` normally.

</details>

**4. Seed the database**

```bash
npm run db:seed
```

This creates the categories and a starter game catalogue. If you also set `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` in your `.env`, it creates an admin account so you can open `/admin` —
otherwise it skips that step and tells you so. There is deliberately **no default admin password**:
a hardcoded credential in a public repo becomes a real vulnerability the moment someone deploys it.

**5. Import the full catalogue (optional but recommended)**

```bash
npm run import:steam
```

This pulls ~120 real games from Steam's public store API — genres, feature tags, list prices,
Metacritic scores, screenshots and trailers. It takes a few minutes: the endpoint is rate limited, so
requests are spaced out and cached to `.steam-cache/` (gitignored) for re-runs.

It is safe to run repeatedly. It matches games on their Steam app id, so a second run updates rather
than duplicates, and it never deletes a game that a customer already owns.

**6. Start the app**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser — you should see the storefront. 🎉

---

## 🧪 Tests

| Command                 | What it does                                                                    |
| ----------------------- | ------------------------------------------------------------------------------- |
| `npm test`              | Unit tests ([Vitest](https://vitest.dev)) — pure logic, no network, no database |
| `npm run test:watch`    | The same suite in watch mode                                                    |
| `npm run test:coverage` | Unit tests with a V8 coverage report                                            |
| `npm run test:e2e`      | End-to-end browser tests ([Playwright](https://playwright.dev))                 |
| `npm run typecheck`     | `tsc --noEmit`                                                                  |
| `npm run lint`          | ESLint                                                                          |
| `npm run format`        | Prettier                                                                        |
| `npm run db:seed`       | Fill a database with categories, a starter catalogue, and (optionally) an admin |
| `npm run import:steam`  | Import ~120 games from Steam: genres, features, screenshots, trailers, prices   |
| `npm run verify:images` | Check that every game's cover art still resolves                                |

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
├── hooks/          # Shared client hooks (list query params, debounced search)
├── lib/            # Shared helpers (email templates, pagination, date series)
├── services/       # Business logic (e.g., what happens during checkout)
├── test/           # Test doubles (the Prisma mock, the server-only stub)
└── auth.ts         # NextAuth configuration
prisma/
├── schema.prisma   # The database blueprint: every table and its columns
├── seed.ts         # Fills a fresh database with categories, games, and an admin
└── migrations/     # SQL files that build the database step by step
scripts/            # One-off maintenance: Steam import, cover-art verification
e2e/                # Playwright end-to-end specs
```

A few design decisions worth knowing about:

- **Security lives in the data layer.** Every function in `src/data/` that changes data checks _itself_ whether the current user is allowed to do it — even if the page already checked. This "defense in depth" approach means a bug in one page can't accidentally expose admin actions.
- **Route groups** like `(store)` and `(auth)` organize files without affecting URLs, while `admin/` is a real URL segment so all admin pages clearly live under `/admin`.
- **Cron endpoints are protected** with a secret token, so random visitors can't trigger the background jobs.
- **Emails escape user input** before inserting it into HTML, preventing injection attacks.
- **Password reset tokens live in their own table, hashed.** They deliberately do _not_ reuse NextAuth's `VerificationToken`: that table is looked up by token value with no purpose check, so a reset token pasted into `/verify-email?token=…` would have verified the account's email address instead. Cross-purpose token confusion is a real vulnerability class, so the two token spaces are kept disjoint. Only a SHA-256 of each token is stored, so a leaked database backup can't be used to take over accounts.
- **The forgot-password form never reveals whether an account exists.** It reports the same message either way, including when the per-account throttle (3 requests per 15 minutes) silently drops the request.
- **Catalogue state lives in the URL, not in React state.** `/games?q=…&genre=…&sort=…&page=…` is the single source of truth, so the server renders the exact view you're looking at, the back button works, and links are shareable. Only the search box and the two filter selects are client components; everything else stays a Server Component.
- **The sort parameter is a whitelist, never a raw string.** `?sort=` is parsed through a Zod enum into a lookup map, so a hand-edited URL can't reach `orderBy`. Same for the genre slug, which must match a slug-shaped pattern. Bad values fall back to defaults rather than erroring — a public page shouldn't 500 because someone typed in the address bar.
- **The admin list never selects the password column.** `prisma.user.findMany()` without an explicit `select` returns the bcrypt hash, and anything derived from those rows that reaches a client component serialises it into the page payload. Every user query uses an explicit `select`, and both a unit test and an end-to-end test assert no hash appears.
- **You can't lock yourself out of the admin area.** Changing your own role is refused outright, and demoting anyone else counts the _other_ remaining admins first — inside a `Serializable` transaction, because count-then-update is a time-of-check/time-of-use race that two concurrent demotions could both win. Written the obvious way (`count({ role: "ADMIN" }) <= 1`) the check would be unreachable dead code, since the only admin you can be the last of is yourself.
- **Deleting users is deliberately not implemented.** `Order.userId` cascades, so deleting a user would destroy their paid order history — the same rows the revenue KPIs, trend charts, and weekly report all aggregate over. Doing it properly means soft-delete: a `deletedAt` column, PII scrubbed, orders retained, and the foreign key relaxed to `Restrict`. That's a schema change and a separate feature, so the page doesn't offer a button that quietly destroys revenue data.
- **`callbackUrl` is validated before use.** Pages like `/library` and `/account` redirect to `/login?callbackUrl=…`, which the sign-in form previously ignored entirely (it always went to `/`). Honouring it naively is an open redirect: `//evil.com` is a protocol-relative URL that passes a `startsWith("/")` check and navigates off-site, which is what makes a phishing link look legitimate. It's now reduced to a same-origin path first.
- **Pagination orders by a unique tiebreaker.** Sorting by price alone means rows with equal prices have no defined order, so OFFSET paging can show the same game twice or skip one entirely. Every catalogue query ends with `{ id: "asc" }`. The `count()` also always uses the exact same `where` as the `findMany()`.

### What the Steam importer had to work around

`scripts/import-steam-games.ts` is more defensive than it looks, and every guard in it exists because
the obvious version produced wrong data:

- **The API geolocates by IP.** Without `cc=us&l=english`, the same request returns genre names in the caller's language and prices in whatever currency it guesses — a catalogue with Turkish tags and prices mixed across USD, CAD and GBP. It also changed one game from "no trailers" to two.
- **Steam's `type` field can't be trusted.** OBS Studio, Wallpaper Engine, Crosshair X and Soundpad all report `type: "game"` and all appear in the most-played chart. They're identified by their genres instead, which come from Steam's software id range, and the software genres they drag in are cleaned up afterwards.
- **Two category ids can share one name** — 55 and 56 are both "DualShock Controller Support" — so a feature's identity is its slug, not the upstream id. Keying on the id produced duplicate tags on the same game.
- **Prices use `initial`, not `final`.** `final` includes whatever sale is running right now, which would freeze a temporary discount into the catalogue permanently.
- **Cover URLs are verified, not assumed.** The API doesn't return the portrait "library capsule", so it has to be constructed — but newer titles use hashed asset paths and some publish no portrait art at all. Each candidate is checked with a `HEAD` request before being stored, falling back to the landscape header image, which the API does return. Cards letterbox those over a blurred copy of themselves so the artwork isn't sliced in half.
- **Imported descriptions are sanitised at write time**, once, with a tag allowlist and images restricted to Steam's own CDNs — rather than trusting the markup on every render.
- **Trailers need a streaming player.** Steam serves DASH and HLS only; there is no progressive MP4 anywhere in the response. `hls.js` is loaded lazily on first play, and `Hls.isSupported()` is checked **before** native playback: Chrome answers `canPlayType("application/vnd.apple.mpegurl")` with a truthy `"maybe"` despite being unable to play HLS, so testing native support first leaves the video stuck forever.

---

## ⚠️ Known limitations

This is a portfolio project, so a few things are intentionally simplified:

- **No real payments** — checkout is simulated. Integrating a real gateway (like Stripe) would be the next step for a production store.
- **Sessions can't be revoked on password reset.** Sessions are JWTs with no server-side session table, so a reset changes the password but does not sign out devices that are already logged in. Fixing it properly means either a `passwordChangedAt` column checked on every request or switching to database sessions. Partially mitigated: the token's role is re-read at most every 5 minutes, so role changes converge and a deleted user's session is dropped — but a password change still won't kick out an existing session.
- **Role changes take up to 5 minutes.** That re-read interval is a deliberate trade-off against a database lookup on every authenticated request. The admin UI says so rather than pretending the change is instant; signing out and back in applies it immediately.
- **No IP-level rate limiting.** Password reset requests are throttled per account in the database (3 per 15 minutes), which is correct across serverless instances. Limiting by IP belongs at the edge — Vercel WAF or Upstash — and is out of scope here. An in-memory limiter would be per-instance on serverless, i.e. no limit at all.
- **Email verification isn't enforced at login.** It's advisory: unverified accounts can still sign in.
- **Search isn't index-accelerated.** There are btree indexes on `title`, `price`, and `releaseDate`, but those only support the `ORDER BY` of each sort option. The search itself compiles to `ILIKE '%query%'`, and a leading wildcard can't use a btree — so it's a sequential scan. At real catalogue scale the fix is a `pg_trgm` GIN index (`CREATE INDEX ... USING gin (title gin_trgm_ops)`) or a full-text `tsvector` column with a trigger. Neither is implemented here: Prisma has no first-class support for either, and the catalogue is ~120 rows. Adding a GIN index at this size would be cargo cult.
- **All media is hotlinked, not hosted.** Cover art, screenshots and trailers are served from Steam's CDN. They're publisher-owned and live on infrastructure this project doesn't control, so they can change or stop resolving — `npm run verify:images` checks every cover in one command. A production store would license its media and serve it itself.
- **Eight games have no portrait cover.** Steam publishes none for them, so they fall back to the landscape store header, letterboxed in the card. That's an upstream gap rather than something to fix in code.
- **Imported data is a snapshot.** Prices, review counts and Metacritic scores are captured at import time and don't track Steam afterwards. Re-running `npm run import:steam` refreshes them.
- **The catalogue is capped at ~120 games.** App ids come from Steam's most-played chart plus a curated list, and the endpoint is rate limited to roughly 200 requests per 5 minutes. Going much larger means batching the import across a longer window.
- **No mobile navigation.** The navbar has no hamburger menu, so the search box is hidden below the `sm` breakpoint (the `/games` page renders its own for small screens). A proper mobile nav is the next UI job.
- **Simple pagination** — admin lists show 20 items per page, the storefront 24. Offset-based, which is fine at this scale; keyset pagination would be the move at much larger volumes.

---

## 📄 License

This project was built for learning and portfolio purposes. Feel free to explore the code and learn from it!
