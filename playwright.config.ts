import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end suite. Unlike the Vitest suite, these run against a real database
 * and a real production build, so they must never be pointed at production data
 * — see the E2E section of the README.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // A single worker locally keeps the shared seeded database predictable.
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // `next start`, not `next dev` — dev-mode compilation makes the first hit on
    // every route slow enough to cause flaky timeouts.
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
