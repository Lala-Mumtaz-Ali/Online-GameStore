import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import sanitizeHtml from "sanitize-html";

/**
 * Imports store metadata - genres, feature tags, screenshots, trailers - from
 * Steam's public store API.
 *
 *   npx tsx scripts/import-steam-games.ts
 *
 * Two things worth knowing before changing this:
 *
 * 1. `cc=us&l=english` is not optional. The API geolocates by IP, and without
 *    it the same request returns Turkish genre names and prices in whatever
 *    currency it guesses - which silently produces a catalogue with mixed
 *    currencies and untranslated tags.
 *
 * 2. Responses are cached to disk. Steam rate-limits this endpoint (roughly
 *    200 requests per 5 minutes), so a re-run should not refetch what it
 *    already has.
 */

const prisma = new PrismaClient();

const CACHE_DIR = path.join(process.cwd(), ".steam-cache");
const REQUEST_DELAY_MS = 600;
const TARGET_CATALOGUE_SIZE = 120;
const MAX_SCREENSHOTS = 12;
const MAX_TRAILERS = 3;

/** The hand-picked core of the catalogue: verified, well-known, genre-spread. */
const CURATED_APP_IDS = [
  782330, 814380, 1145360, 601150, 367520, 504230, 870780, 1237970, 588650, 235460,
  1139900, 582010, 2050650, 1057090, 292030, 1245620, 1086940, 435150, 632470, 1091500,
  489830, 377160, 374320, 524220, 1687950, 379430, 1328670, 289070, 1142710, 1466860,
  268500, 281990, 1158310, 394360, 323190, 590380, 294100, 427520, 255710, 261550,
];

/**
 * Steam's own `type` field is not trustworthy for this: OBS Studio, Crosshair X
 * and Bongo Cat all report type="game" and all appear in the most-played chart.
 * What actually distinguishes them is their genres, which come from Steam's
 * software range rather than its game range.
 */
const SOFTWARE_GENRE_IDS = new Set([
  50, // Accounting
  51, // Animation & Modeling
  52, // Audio Production
  53, // Design & Illustration
  54, // Education
  55, // Photo Editing
  56, // Software Training
  57, // Utilities
  58, // Video Production
  59, // Web Publishing
  60, // Game Development
]);

function isSoftware(app: { genres?: { id: string }[] }) {
  return (app.genres ?? []).some((g) => SOFTWARE_GENRE_IDS.has(Number(g.id)));
}

type SteamApp = {
  type: string;
  name: string;
  steam_appid: number;
  is_free: boolean;
  short_description?: string;
  about_the_game?: string;
  header_image?: string;
  website?: string | null;
  developers?: string[];
  publishers?: string[];
  price_overview?: { initial: number; final: number; currency: string };
  platforms?: { windows: boolean; mac: boolean; linux: boolean };
  metacritic?: { score: number; url: string };
  categories?: { id: number; description: string }[];
  genres?: { id: string; description: string }[];
  screenshots?: { id: number; path_thumbnail: string; path_full: string }[];
  movies?: { id: number; name: string; thumbnail: string; hls_h264?: string }[];
  recommendations?: { total: number };
  release_date?: { coming_soon: boolean; date: string };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchAppDetails(appId: number): Promise<SteamApp | null> {
  const cacheFile = path.join(CACHE_DIR, `${appId}.json`);

  if (fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    return cached?.[appId]?.success ? (cached[appId].data as SteamApp) : null;
  }

  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=english`;
  const response = await fetch(url);

  if (!response.ok) {
    console.log(`  ${appId}: HTTP ${response.status}`);
    await sleep(REQUEST_DELAY_MS);
    return null;
  }

  const payload = await response.json();
  fs.writeFileSync(cacheFile, JSON.stringify(payload));
  await sleep(REQUEST_DELAY_MS);

  return payload?.[appId]?.success ? (payload[appId].data as SteamApp) : null;
}

/** Top 100 by concurrent players - real ids from Steam, not guessed. */
async function fetchMostPlayedAppIds(): Promise<number[]> {
  const response = await fetch(
    "https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/"
  );
  if (!response.ok) return [];

  const payload = await response.json();
  return (payload?.response?.ranks ?? []).map((r: { appid: number }) => r.appid);
}

/**
 * Steam's rich description is authored HTML. It is rendered with
 * dangerouslySetInnerHTML, so it is sanitised here - at write time, once -
 * rather than trusting it at read time on every request.
 */
function sanitizeAbout(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "img",
      "a",
    ],
    allowedAttributes: { img: ["src", "alt"], a: ["href"] },
    // Images may only come from Steam's own CDNs; anything else is dropped
    // rather than turned into a request to an arbitrary third party.
    allowedSchemes: ["https"],
    transformTags: {
      img: (tagName, attribs) => {
        const src = attribs.src ?? "";
        const allowed = /^https:\/\/[a-z0-9.-]*steamstatic\.com\//i.test(src);
        return allowed ? { tagName, attribs } : { tagName: "span", attribs: {} };
      },
    },
  }).trim();
}

/** Steam gives a display string ("Mar 19, 2020"), not an ISO date. */
function parseReleaseDate(app: SteamApp): Date | null {
  const raw = app.release_date?.date?.trim();
  if (!raw) return null;

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  // "Q1 2026", "Coming soon", "2026" and similar are not real dates. Treat an
  // unreleased game as far-future so it lands in /upcoming rather than being
  // dropped; drop anything else as unusable.
  if (app.release_date?.coming_soon) {
    const year = raw.match(/\b(20\d{2})\b/)?.[1];
    return new Date(`${year ?? new Date().getFullYear() + 1}-12-31`);
  }

  return null;
}

function priceFor(app: SteamApp): number | null {
  if (app.is_free) return 0;
  // `initial` is the list price. `final` includes whatever sale is running
  // today, which would bake a temporary discount into the catalogue.
  const cents = app.price_overview?.initial;
  return typeof cents === "number" ? cents / 100 : null;
}

/**
 * Genres and features repeat constantly across the catalogue - almost every
 * game is "Single-player" - so they are resolved once and then served from
 * memory. Upserting them per game turned each import into ~20 extra round
 * trips to a remote database and dominated the runtime.
 */
const genreCache = new Map<string, true>();
const featureCache = new Map<string, string>();

async function warmCaches() {
  const [categories, features] = await Promise.all([
    prisma.category.findMany({ select: { slug: true } }),
    prisma.feature.findMany({ select: { slug: true, id: true } }),
  ]);

  for (const c of categories) genreCache.set(c.slug, true);
  for (const f of features) featureCache.set(f.slug, f.id);
}

async function resolveGenres(genres: SteamApp["genres"]) {
  const slugs: string[] = [];

  for (const genre of genres ?? []) {
    const slug = slugify(genre.description);
    if (!slug || slugs.includes(slug)) continue;

    if (!genreCache.has(slug)) {
      await prisma.category.upsert({
        where: { slug },
        update: { steamGenreId: Number(genre.id) },
        create: { name: genre.description, slug, steamGenreId: Number(genre.id) },
      });
      genreCache.set(slug, true);
    }

    slugs.push(slug);
  }

  return slugs;
}

async function resolveFeatures(categories: SteamApp["categories"]) {
  const ids: string[] = [];

  for (const category of categories ?? []) {
    const slug = slugify(category.description);
    if (!slug) continue;

    let id = featureCache.get(slug);

    if (!id) {
      const feature = await prisma.feature.upsert({
        where: { slug },
        update: { name: category.description },
        create: { slug, name: category.description, steamId: category.id },
      });
      id = feature.id;
      featureCache.set(slug, id);
    }

    // The same feature can appear twice in one app's list under different ids.
    if (!ids.includes(id)) ids.push(id);
  }

  return ids;
}

async function importApp(app: SteamApp) {
  const price = priceFor(app);
  const releaseDate = parseReleaseDate(app);

  if (price === null || releaseDate === null) {
    return { skipped: `${app.name}: missing price or release date` };
  }

  const genreSlugs = await resolveGenres(app.genres);
  const featureIds = await resolveFeatures(app.categories);

  // Trademark symbols read as noise in a storefront listing; edition suffixes
  // are kept because they are part of what is actually being sold.
  const title = app.name.replace(/[™®©]/g, "").replace(/\s+/g, " ").trim();
  const description = app.short_description?.replace(/<[^>]*>/g, "").trim() || title;

  const data = {
    title,
    description,
    aboutHtml: app.about_the_game ? sanitizeAbout(app.about_the_game) : null,
    price,
    releaseDate,
    imageUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${app.steam_appid}/library_600x900.jpg`,
    headerImage: app.header_image ?? null,
    developer: app.developers?.[0] ?? null,
    publisher: app.publishers?.[0] ?? null,
    metacriticScore: app.metacritic?.score ?? null,
    metacriticUrl: app.metacritic?.url ?? null,
    reviewCount: app.recommendations?.total ?? null,
    website: app.website ?? null,
    onWindows: app.platforms?.windows ?? true,
    onMac: app.platforms?.mac ?? false,
    onLinux: app.platforms?.linux ?? false,
  };

  const existing =
    (await prisma.game.findUnique({
      where: { steamAppId: app.steam_appid },
      select: { id: true },
    })) ??
    // Games seeded before steamAppId existed still encode their app id in the
    // cover URL, so they can be adopted rather than duplicated. Matching this
    // way avoids a hardcoded slug-to-id table that would rot immediately.
    (await prisma.game.findFirst({
      where: {
        steamAppId: null,
        imageUrl: { contains: `/apps/${app.steam_appid}/` },
      },
      select: { id: true },
    }));

  const categoryRefs = genreSlugs.map((s) => ({ slug: s }));
  const featureRefs = featureIds.map((id) => ({ id }));

  let game;

  if (existing) {
    // The slug is deliberately left alone on an update: it is the public URL,
    // and rewriting it would break links and bookmarks for a cosmetic gain.
    game = await prisma.game.update({
      where: { id: existing.id },
      data: {
        ...data,
        steamAppId: app.steam_appid,
        // `set` replaces the whole relation, so a genre removed upstream is
        // removed here too.
        categories: { set: categoryRefs },
        features: { set: featureRefs },
      },
    });
  } else {
    // Two different games can slugify identically; suffix rather than collide.
    const base = slugify(title);
    const taken = await prisma.game.findUnique({
      where: { slug: base },
      select: { id: true },
    });
    const slug = taken ? `${base}-${app.steam_appid}` : base;

    game = await prisma.game.create({
      data: {
        ...data,
        slug,
        steamAppId: app.steam_appid,
        categories: { connect: categoryRefs },
        features: { connect: featureRefs },
      },
    });
  }

  // Replaced wholesale rather than merged: upstream ordering is curated, and
  // position is unique per game so a partial update would collide.
  await prisma.gameScreenshot.deleteMany({ where: { gameId: game.id } });
  await prisma.gameTrailer.deleteMany({ where: { gameId: game.id } });

  const screenshots = (app.screenshots ?? []).slice(0, MAX_SCREENSHOTS);
  if (screenshots.length > 0) {
    await prisma.gameScreenshot.createMany({
      data: screenshots.map((shot, position) => ({
        gameId: game.id,
        url: shot.path_full,
        thumbnailUrl: shot.path_thumbnail,
        position,
      })),
    });
  }

  const trailers = (app.movies ?? [])
    .filter((movie) => Boolean(movie.hls_h264))
    .slice(0, MAX_TRAILERS);

  if (trailers.length > 0) {
    await prisma.gameTrailer.createMany({
      data: trailers.map((movie, position) => ({
        gameId: game.id,
        name: movie.name,
        // Steam sometimes returns protocol-relative or http URLs; the page is
        // https, so a mixed-content URL would be blocked by the browser.
        thumbnailUrl: movie.thumbnail.replace(/^http:/, "https:"),
        hlsUrl: movie.hls_h264!.replace(/^http:/, "https:"),
        position,
      })),
    });
  }

  return {
    imported: `${app.name} (${genreSlugs.length} genres, ${featureIds.length} features, ${screenshots.length} shots, ${trailers.length} trailers)`,
  };
}

/**
 * Cleans up software that earlier runs let through before the genre filter
 * existed. Anything a customer already owns is left alone, because deleting it
 * would null OrderItem.gameId and drop the item from their library.
 */
async function removeImportedSoftware() {
  const softwareGenres = await prisma.category.findMany({
    where: { steamGenreId: { in: [...SOFTWARE_GENRE_IDS] } },
    select: { id: true },
  });

  if (softwareGenres.length === 0) return;

  const suspects = await prisma.game.findMany({
    where: {
      steamAppId: { not: null },
      categories: { some: { id: { in: softwareGenres.map((g) => g.id) } } },
    },
    select: {
      id: true,
      title: true,
      _count: { select: { orderItems: true, preorders: true } },
    },
  });

  const removable = suspects.filter(
    (g) => g._count.orderItems === 0 && g._count.preorders === 0
  );

  if (removable.length > 0) {
    await prisma.game.deleteMany({ where: { id: { in: removable.map((g) => g.id) } } });
    console.log(`\nRemoved ${removable.length} non-game app(s):`);
    for (const g of removable) console.log(`  ${g.title}`);
  }
}

/** A genre with nothing in it is dead weight in the storefront filter. */
async function removeEmptyGenres() {
  const empty = await prisma.category.findMany({
    where: { games: { none: {} }, steamGenreId: { not: null } },
    select: { id: true, name: true },
  });

  if (empty.length === 0) return;

  await prisma.category.deleteMany({ where: { id: { in: empty.map((c) => c.id) } } });
  console.log(
    `Removed ${empty.length} empty genre(s): ${empty.map((c) => c.name).join(", ")}`
  );
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  await warmCaches();

  console.log("Fetching most-played app ids...");
  const mostPlayed = await fetchMostPlayedAppIds();
  console.log(`  got ${mostPlayed.length}`);

  // Curated first so the well-known titles are guaranteed a slot if the
  // target size is reached.
  const candidates = [...new Set([...CURATED_APP_IDS, ...mostPlayed])];
  console.log(`\n${candidates.length} candidate app ids\n`);

  let imported = 0;
  const skipped: string[] = [];

  for (const appId of candidates) {
    if (imported >= TARGET_CATALOGUE_SIZE) break;

    const app = await fetchAppDetails(appId);

    if (!app) {
      skipped.push(`${appId}: no data`);
      continue;
    }
    // Filters out DLC, soundtracks, videos, and tools such as Wallpaper Engine,
    // which appear in the most-played chart but are not games.
    if (app.type !== "game") {
      skipped.push(`${appId}: type=${app.type}`);
      continue;
    }
    if (isSoftware(app)) {
      skipped.push(`${app.name}: software, not a game`);
      continue;
    }

    const result = await importApp(app);

    if (result.skipped) {
      skipped.push(result.skipped);
    } else {
      imported++;
      console.log(`  [${imported}] ${result.imported}`);
    }
  }

  await removeImportedSoftware();
  await removeEmptyGenres();

  const [games, categoryCount, featureCount, shotCount, trailerCount] = await Promise.all(
    [
      prisma.game.count(),
      prisma.category.count(),
      prisma.feature.count(),
      prisma.gameScreenshot.count(),
      prisma.gameTrailer.count(),
    ]
  );

  console.log(`\nImported/updated ${imported} games.`);
  console.log(`Skipped ${skipped.length}:`);
  for (const reason of skipped.slice(0, 15)) console.log(`  ${reason}`);
  if (skipped.length > 15) console.log(`  ...and ${skipped.length - 15} more`);

  console.log(
    `\nCatalogue now: ${games} games, ${categoryCount} genres, ${featureCount} features, ${shotCount} screenshots, ${trailerCount} trailers.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
