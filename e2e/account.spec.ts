import { expect, type Page, test } from "@playwright/test";

const PASSWORD = "e2e-password-123";

function uniqueEmail() {
  return `e2e-acct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Registers a fresh account and signs in, returning its credentials. */
async function signUpAndIn(page: Page, name = "E2E User") {
  const email = uniqueEmail();

  await page.goto("/register");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/");

  return { email, name };
}

test.describe("account page", () => {
  test("signed-out visitors are sent to sign in and back again", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL("/login?callbackUrl=/account");

    const { email } = await (async () => {
      const created = uniqueEmail();
      await page.goto("/register");
      await page.getByLabel("Name").fill("E2E User");
      await page.getByLabel("Email").fill(created);
      await page.getByLabel("Password").fill(PASSWORD);
      await page.getByRole("button", { name: "Create account" }).click();
      await expect(page).toHaveURL(/\/login$/);
      return { email: created };
    })();

    // Land on /login via the guard, then sign in: the callbackUrl must be honoured.
    await page.goto("/login?callbackUrl=/account");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL("/account");
  });

  // //evil.com is protocol-relative and passes a naive startsWith("/") check.
  test("a protocol-relative callbackUrl cannot redirect off-site", async ({ page }) => {
    const email = uniqueEmail();
    await page.goto("/register");
    await page.getByLabel("Name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/login?callbackUrl=//example.org");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL("/");
  });

  test("shows account details and the unverified-email prompt", async ({ page }) => {
    const { email } = await signUpAndIn(page);

    await page.goto("/account");

    await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText("Not verified")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resend verification email" })
    ).toBeVisible();
  });

  test("renaming updates the navbar without signing out", async ({ page }) => {
    await signUpAndIn(page, "Original Name");
    await page.goto("/account");

    await expect(page.getByRole("link", { name: "Original Name" })).toBeVisible();

    await page.getByLabel("Display name").fill("Renamed User");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Profile updated")).toBeVisible();
    await expect(page.getByRole("link", { name: "Renamed User" })).toBeVisible();
  });

  test("a wrong current password is rejected and the old one still works", async ({
    page,
  }) => {
    const { email } = await signUpAndIn(page);
    await page.goto("/account");

    await page.getByLabel("Current password").fill("not-the-password");
    await page.getByLabel("New password", { exact: true }).fill("brand-new-password");
    await page.getByLabel("Confirm new password").fill("brand-new-password");
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(page.getByText("Your current password is incorrect.")).toBeVisible();

    // The original password must still be valid.
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL("/");
  });

  test("changing the password works and the new one signs in", async ({ page }) => {
    const { email } = await signUpAndIn(page);
    const newPassword = "brand-new-password-1";

    await page.goto("/account");
    await page.getByLabel("Current password").fill(PASSWORD);
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(page.getByText("Password changed")).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL("/");
  });

  test("mismatched confirmation is rejected", async ({ page }) => {
    await signUpAndIn(page);
    await page.goto("/account");

    await page.getByLabel("Current password").fill(PASSWORD);
    await page.getByLabel("New password", { exact: true }).fill("brand-new-password");
    await page.getByLabel("Confirm new password").fill("something-different");
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });
});
