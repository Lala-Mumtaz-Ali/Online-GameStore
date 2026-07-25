import { expect, test } from "@playwright/test";

/**
 * Each run registers a fresh account: the suite shares a seeded database, and a
 * fixed email would fail on the second run with "account already exists".
 */
function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

const PASSWORD = "e2e-password-123";

test.describe("registration and sign in", () => {
  test("a new user can register, sign in, and sign out", async ({ page }) => {
    const email = uniqueEmail();

    await page.goto("/register");
    await page.getByLabel("Name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    // The register action redirects to /login on success.
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "Library" })).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("signing in with a wrong password shows an error and stays on /login", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("registering with an existing email is rejected", async ({ page }) => {
    const email = uniqueEmail();

    for (const attempt of [1, 2]) {
      await page.goto("/register");
      await page.getByLabel("Name").fill("E2E User");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(PASSWORD);
      await page.getByRole("button", { name: "Create account" }).click();

      if (attempt === 1) await expect(page).toHaveURL(/\/login$/);
    }

    await expect(
      page.getByText("An account with this email already exists.")
    ).toBeVisible();
  });

  test("protected pages redirect anonymous visitors to sign in", async ({ page }) => {
    await page.goto("/library");

    await expect(page).toHaveURL(/\/login/);
  });
});
