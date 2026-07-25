import "dotenv/config";
import { PrismaClient } from "@prisma/client";

/**
 * Checks that every game's imageUrl still serves a real image.
 *
 * Cover art is hotlinked from a CDN this project does not control, so a URL
 * that worked at seed time can start 404-ing later. This turns that from
 * "someone eventually notices a broken card" into a command you can run.
 *
 *   npx tsx scripts/verify-game-images.ts
 *
 * Exits non-zero if anything is broken, so it can be wired into a scheduled
 * check later if that ever becomes worthwhile.
 */

const prisma = new PrismaClient();

type Result = {
  slug: string;
  title: string;
  url: string;
  ok: boolean;
  detail: string;
};

async function check(url: string): Promise<{ ok: boolean; detail: string }> {
  try {
    // HEAD first: no body transfer when the CDN supports it.
    let response = await fetch(url, { method: "HEAD", redirect: "follow" });

    // Some CDNs reject HEAD; fall back to a ranged GET rather than pulling the
    // whole image.
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, { headers: { Range: "bytes=0-0" } });
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok) return { ok: false, detail: `HTTP ${response.status}` };
    if (!contentType.startsWith("image/")) {
      return { ok: false, detail: `not an image (${contentType || "no content-type"})` };
    }

    return { ok: true, detail: contentType };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "request failed" };
  }
}

async function main() {
  const games = await prisma.game.findMany({
    select: { slug: true, title: true, imageUrl: true },
    orderBy: { title: "asc" },
  });

  const missing = games.filter((g) => !g.imageUrl);
  const withImages = games.filter(
    (g): g is typeof g & { imageUrl: string } => g.imageUrl !== null
  );

  const results: Result[] = [];
  // Small concurrency: enough to be quick, not enough to look like an attack.
  const BATCH = 8;
  for (let i = 0; i < withImages.length; i += BATCH) {
    const batch = withImages.slice(i, i + BATCH);
    const checked = await Promise.all(
      batch.map(async (game) => {
        const { ok, detail } = await check(game.imageUrl);
        return { slug: game.slug, title: game.title, url: game.imageUrl, ok, detail };
      })
    );
    results.push(...checked);
  }

  const broken = results.filter((r) => !r.ok);

  console.log(`Checked ${results.length} image URLs.`);
  console.log(`  OK:      ${results.length - broken.length}`);
  console.log(`  Broken:  ${broken.length}`);
  console.log(`  Missing: ${missing.length} game(s) have no image at all`);

  for (const game of missing) {
    console.log(`    (no image) ${game.slug} - ${game.title}`);
  }

  for (const result of broken) {
    console.log(`\n  BROKEN ${result.slug} - ${result.title}`);
    console.log(`    ${result.url}`);
    console.log(`    ${result.detail}`);
  }

  if (broken.length > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
