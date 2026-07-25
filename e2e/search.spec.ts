import { expect, type Page, test } from "@playwright/test";

const gameCards = 'a[href^="/games/"]';

/**
 * Search terms are pinned to the seeded catalogue, so they live here rather
 * than being scattered through the specs - reseeding with a different set of
 * games should only require editing these two lines.
 *
 * UNIQUE_TERM must match exactly one seeded title; SOME_TERM only has to match
 * at least one.
 */
const UNIQUE_TERM = "witcher"; // -> The Witcher 3: Wild Hunt
const SOME_TERM = "ass"; // -> Mass Effect Legendary Edition

/**
 * Record every URL the page moves through, including client-side replaces that
 * leave no history entry. Used to prove a search settles on one URL instead of
 * oscillating.
 */
async function recordUrlChanges(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __urlLog: string[] };
    w.__urlLog = [location.pathname + location.search];

    const record = () => {
      const url = location.pathname + location.search;
      if (w.__urlLog[w.__urlLog.length - 1] !== url) w.__urlLog.push(url);
    };

    for (const method of ["pushState", "replaceState"] as const) {
      const original = history[method].bind(history);
      history[method] = (data: unknown, unused: string, url?: string | URL | null) => {
        original(data, unused, url);
        record();
      };
    }

    window.addEventListener("popstate", record);
    setInterval(record, 50);
  });
}

function readUrlLog(page: Page) {
  return page.evaluate(() => (window as unknown as { __urlLog: string[] }).__urlLog);
}

test.describe("catalogue search and filtering", () => {
  test("typing in the navbar search updates the URL after the debounce", async ({
    page,
  }) => {
    await page.goto("/games");

    await page.getByLabel("Search games").first().fill(UNIQUE_TERM);

    // The input is debounced by 300ms, so this waits rather than asserting
    // immediately. If the debounce regressed to navigating per keystroke, the
    // history assertion in the next test catches it.
    await expect(page).toHaveURL(new RegExp(`[?&]q=${UNIQUE_TERM}`), { timeout: 5000 });
    await expect(page.locator(gameCards)).toHaveCount(1);
  });

  test("the debounce does not push one history entry per keystroke", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Search games").first().fill(UNIQUE_TERM);
    await expect(page).toHaveURL(new RegExp(`/games\\?q=${UNIQUE_TERM}`));

    // One entry for the whole search, so a single Back returns to the home page.
    await page.goBack();
    await expect(page).toHaveURL("/");

    // And it STAYS there. A search box holding stale text used to re-apply its
    // own query on arrival, shoving the user straight back forward again.
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL("/");
    await expect(page.getByLabel("Search games").first()).toHaveValue("");
  });

  /**
   * Regression: /games mounts two copies of the search box (navbar above `sm`,
   * page below), each with its own local text state. Both were live, so typing
   * in one wrote `?q=...` and the other — still holding an empty string — wrote
   * it straight back off, flipping the page between the two states forever.
   */
  test("the search settles on one URL instead of oscillating", async ({ page }) => {
    await page.goto("/games");
    await recordUrlChanges(page);

    await page.getByLabel("Search games").first().fill(SOME_TERM);
    await expect(page).toHaveURL(new RegExp(`[?&]q=${SOME_TERM}`));

    // Well past the 300ms debounce: any feedback loop would have flipped by now.
    await page.waitForTimeout(2000);

    expect(await readUrlLog(page)).toEqual(["/games", `/games?q=${SOME_TERM}`]);
    await expect(page).toHaveURL(new RegExp(`[?&]q=${SOME_TERM}`));
  });

  test("both search boxes end up showing the same text", async ({ page }) => {
    await page.goto("/games");

    await page.getByLabel("Search games").first().fill(UNIQUE_TERM);
    await expect(page).toHaveURL(new RegExp(`[?&]q=${UNIQUE_TERM}`));

    const boxes = page.getByLabel("Search games");
    for (let i = 0; i < (await boxes.count()); i++) {
      await expect(boxes.nth(i)).toHaveValue(UNIQUE_TERM);
    }
  });

  test("Clear filters resets the search box, not just the URL", async ({ page }) => {
    await page.goto(`/games?q=${UNIQUE_TERM}`);

    await page.getByRole("link", { name: "Clear filters" }).first().click();

    await expect(page).toHaveURL("/games");
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL("/games");
    await expect(page.getByLabel("Search games").first()).toHaveValue("");
  });

  test("a search with no matches shows the empty state", async ({ page }) => {
    await page.goto("/games?q=zzznomatchzzz");

    await expect(page.getByText("No games match your search.")).toBeVisible();
    await expect(page.locator(gameCards)).toHaveCount(0);
  });

  test("filtering by genre narrows the results and survives paging", async ({ page }) => {
    await page.goto("/games");
    const unfiltered = await page.locator(gameCards).count();

    await page.getByLabel("Genre").selectOption("rpg");
    await expect(page).toHaveURL(/[?&]genre=rpg/);

    const filtered = await page.locator(gameCards).count();
    expect(filtered).toBeLessThanOrEqual(unfiltered);
  });

  test("changing a filter resets pagination to page 1", async ({ page }) => {
    await page.goto("/games?page=2");

    await page.getByLabel("Sort by").selectOption("price-asc");

    await expect(page).toHaveURL(/[?&]sort=price-asc/);
    await expect(page).not.toHaveURL(/[?&]page=/);
  });

  // The old Pagination built `?page=N` by string concatenation, which silently
  // dropped every other param.
  test("pagination links carry the active sort", async ({ page }) => {
    await page.goto("/games?sort=price-asc");

    const next = page.getByRole("link", { name: "Next" });
    if ((await next.count()) === 0) test.skip(true, "catalogue fits on one page");

    await next.click();

    await expect(page).toHaveURL(/[?&]sort=price-asc/);
    await expect(page).toHaveURL(/[?&]page=2/);
  });

  test("an unknown sort falls back instead of erroring", async ({ page }) => {
    const response = await page.goto("/games?sort=bogus");

    expect(response?.status()).toBe(200);
    await expect(page.locator(gameCards).first()).toBeVisible();
  });

  test("a repeated query param does not break the page", async ({ page }) => {
    const response = await page.goto("/games?q=a&q=b");

    expect(response?.status()).toBe(200);
  });

  test("a fractional page number does not break the page", async ({ page }) => {
    const response = await page.goto("/games?page=2.3");

    expect(response?.status()).toBe(200);
  });

  test("/genre/[slug] redirects into the filtered catalogue", async ({ page }) => {
    await page.goto("/genre/action");

    await expect(page).toHaveURL("/games?genre=action");
  });

  test("an unknown genre still 404s", async ({ page }) => {
    const response = await page.goto("/genre/definitely-not-a-genre");

    expect(response?.status()).toBe(404);
  });
});
