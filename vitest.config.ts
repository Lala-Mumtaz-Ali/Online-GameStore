import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolves the "@/*" -> "./src/*" alias from tsconfig.json natively, so the
    // test suite and the app agree on every import path.
    tsconfigPaths: true,
    alias: {
      // src/data/* modules `import "server-only"`, which throws outside an RSC
      // render. Under test we resolve it to an empty module.
      "server-only": path.resolve(__dirname, "src/test/serverOnlyStub.ts"),
    },
  },
  test: {
    environment: "node",
    // Explicit imports in every test file, so no "types": ["vitest/globals"]
    // entry is needed and tsconfig.json stays untouched.
    globals: false,
    // Scoped to src/ so Vitest never tries to run the Playwright specs in e2e/.
    include: ["src/**/*.test.ts"],
    // src/utils/env.ts calls envSchema.parse() at module load, so anything that
    // transitively imports it throws without these. Declaring them here keeps
    // the suite reproducible on a machine with no .env file at all (i.e. CI).
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      DIRECT_URL: "postgresql://test:test@localhost:5432/test",
      AUTH_SECRET: "test-secret",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NODE_ENV: "test",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/test/**", "src/types/**"],
    },
  },
});
