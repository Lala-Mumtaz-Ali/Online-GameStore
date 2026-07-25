import { expect, test } from "@playwright/test";

/**
 * Requires the seeded admin: run `npm run db:seed` with SEED_ADMIN_EMAIL and
 * SEED_ADMIN_PASSWORD set. CI does this against a disposable Postgres.
 */
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ci-admin-password";

test.describe("admin user management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL("/");
  });

  test("the users page lists accounts", async ({ page }) => {
    await page.goto("/admin/users");

    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
  });

  test("an admin cannot demote themselves", async ({ page }) => {
    await page.goto("/admin/users");

    const ownRow = page.locator("tr", { hasText: ADMIN_EMAIL });
    await expect(ownRow.getByText("(you)")).toBeVisible();
    await expect(ownRow.getByRole("button")).toBeDisabled();
  });

  test("searching filters the list", async ({ page }) => {
    await page.goto("/admin/users");

    await page.getByLabel("Search").fill(ADMIN_EMAIL);
    await expect(page).toHaveURL(/[?&]q=/, { timeout: 5000 });
    await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
  });

  test("filtering by role narrows the list and survives paging", async ({ page }) => {
    await page.goto("/admin/users");

    await page.getByLabel("Role").selectOption("ADMIN");
    await expect(page).toHaveURL(/[?&]role=ADMIN/);

    const next = page.getByRole("link", { name: "Next" });
    if ((await next.count()) > 0) {
      await next.click();
      await expect(page).toHaveURL(/[?&]role=ADMIN/);
    }
  });

  test("a non-admin cannot reach the users page", async ({ page }) => {
    await page.getByRole("button", { name: "Sign out" }).click();

    const email = `e2e-nonadmin-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel("Name").fill("Regular User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("e2e-password-123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("e2e-password-123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/login/);
  });

  // Regression guard: a bare findMany would put the bcrypt hash in the payload.
  test("no password hash appears in the rendered page", async ({ page }) => {
    await page.goto("/admin/users");

    const html = await page.content();

    expect(html).not.toContain("$2b$");
    expect(html).not.toContain("$2a$");
  });
});
