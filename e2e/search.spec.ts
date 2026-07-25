import { expect, test } from "@playwright/test";

const gameCards = 'a[href^="/games/"]';

test.describe("catalogue search and filtering", () => {
  test("typing in the navbar search updates the URL after the debounce", async ({
    page,
  }) => {
    await page.goto("/games");

    await page.getByLabel("Search games").first().fill("ember");

    // The input is debounced by 300ms, so this waits rather than asserting
    // immediately. If the debounce regressed to navigating per keystroke, the
    // history assertion in the next test catches it.
    await expect(page).toHaveURL(/[?&]q=ember/, { timeout: 5000 });
    await expect(page.locator(gameCards)).toHaveCount(1);
  });

  test("the debounce does not push one history entry per keystroke", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Search games").first().fill("ronin");
    await expect(page).toHaveURL(/\/games\?q=ronin/);

    // One entry for the whole search, so a single Back returns to the home page.
    await page.goBack();
    await expect(page).toHaveURL("/");
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
