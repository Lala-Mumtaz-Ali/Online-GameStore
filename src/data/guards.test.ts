import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prismaMock";

// vi.hoisted, because vi.mock factories are hoisted above the imports and would
// otherwise capture `mockAuth` before it is initialised.
const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/db", async () => ({
  default: (await import("@/test/prismaMock")).prismaMock,
}));

const { requireAdmin } = await import("@/data/admin");
const { requireUser } = await import("@/data/session");
const { deleteGame, createCategory } = await import("@/data/games");

const adminSession = { user: { id: "admin_1", role: "ADMIN" } };
const userSession = { user: { id: "user_1", role: "USER" } };

beforeEach(() => {
  mockAuth.mockReset();
  resetPrismaMock();
});

describe("requireAdmin", () => {
  it("throws when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });

  it("throws for a signed-in non-admin", async () => {
    mockAuth.mockResolvedValue(userSession);
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });

  it("returns the session for an admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(requireAdmin()).resolves.toEqual(adminSession);
  });
});

describe("requireUser", () => {
  it("throws when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("You must be signed in to do that.");
  });

  it("throws when the session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    await expect(requireUser()).rejects.toThrow("You must be signed in to do that.");
  });

  it("returns the user, not the whole session", async () => {
    mockAuth.mockResolvedValue(userSession);
    await expect(requireUser()).resolves.toEqual(userSession.user);
  });
});

/**
 * The architectural guarantee this codebase is built on: Server Actions do not
 * check authorization, the data layer does. A page or action that forgot to gate
 * itself still cannot reach the database.
 */
describe("defense in depth: data-layer writes gate themselves", () => {
  it("refuses deleteGame for a non-admin and never reaches Prisma", async () => {
    mockAuth.mockResolvedValue(userSession);

    await expect(deleteGame("game_1")).rejects.toThrow("Unauthorized");
    expect(prismaMock.game.delete).not.toHaveBeenCalled();
  });

  it("refuses createCategory for an anonymous caller and never reaches Prisma", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(createCategory({ name: "Action", slug: "action" })).rejects.toThrow(
      "Unauthorized"
    );
    expect(prismaMock.category.create).not.toHaveBeenCalled();
  });

  it("performs the delete once the caller is an admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    prismaMock.game.delete.mockResolvedValue({ id: "game_1" });

    await deleteGame("game_1");

    expect(prismaMock.game.delete).toHaveBeenCalledWith({ where: { id: "game_1" } });
  });
});
