import { vi } from "vitest";

/**
 * A hand-rolled Prisma double.
 *
 * The unit suite never touches a real database: the only one available is the
 * remote Supabase instance holding live data. Real-database coverage lives in
 * the Playwright suite, which runs against a disposable Postgres in CI.
 *
 * Deliberately not `jest-mock-extended` / `prisma-mock` — a handful of `vi.fn()`
 * is clearer than a proxy that auto-generates the whole client surface, and it
 * is one fewer dependency.
 */
export const prismaMock = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  game: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  category: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  order: {
    findMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  orderItem: {
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
  verificationToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  passwordResetToken: {
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  // Callback form: runs the callback against the same mock, so code under test
  // sees a `tx` client that behaves like the outer one.
  $transaction: vi.fn(),
};

/** Reset every mock between tests without losing the object identity above. */
export function resetPrismaMock() {
  for (const model of Object.values(prismaMock)) {
    if (typeof model === "function") {
      model.mockReset();
      continue;
    }
    for (const fn of Object.values(model)) {
      fn.mockReset();
    }
  }
}
