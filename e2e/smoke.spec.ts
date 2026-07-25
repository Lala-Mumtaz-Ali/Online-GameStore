import { expect, test } from "@playwright/test";

test.describe("storefront", () => {
  test("home page renders the catalogue", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "GameStore" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Games", exact: true })).toBeVisible();
  });

  test("all games page lists seeded games", async ({ page }) => {
    await page.goto("/games");

    await expect(page.getByRole("heading", { name: "All Games" })).toBeVisible();
    // Seeded catalogue; asserting "more than one" rather than an exact count
    // keeps this from breaking every time a game is added.
    await expect(page.locator('a[href^="/games/"]').first()).toBeVisible();
  });

  test("a game detail page opens from the grid", async ({ page }) => {
    await page.goto("/games");

    const firstGame = page.locator('a[href^="/games/"]').first();
    const href = await firstGame.getAttribute("href");
    await firstGame.click();

    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("categories page links through to a genre", async ({ page }) => {
    await page.goto("/categories");

    await expect(page.locator('a[href^="/genre/"]').first()).toBeVisible();
  });

  test("signed-out visitors are offered sign in", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });
});
