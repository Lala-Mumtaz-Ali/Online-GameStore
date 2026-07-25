import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prismaMock";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/db", async () => ({
  default: (await import("@/test/prismaMock")).prismaMock,
}));

const { getPaginatedUsers, setUserRole } = await import("@/data/users");

const ADMIN = { user: { id: "admin_1", role: "ADMIN" } };

beforeEach(() => {
  mockAuth.mockReset();
  resetPrismaMock();
  mockAuth.mockResolvedValue(ADMIN);
  prismaMock.user.findMany.mockResolvedValue([]);
  prismaMock.user.count.mockResolvedValue(0);
  prismaMock.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
    fn(prismaMock)
  );
});

describe("getPaginatedUsers", () => {
  it("requires an admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user_1", role: "USER" } });

    await expect(getPaginatedUsers()).rejects.toThrow("Unauthorized");
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  // A bare findMany returns the bcrypt hash, which would then be serialised
  // into the page payload by anything that passed a row to a client component.
  it("never selects the password hash", async () => {
    await getPaginatedUsers();

    const { select } = prismaMock.user.findMany.mock.calls[0][0];

    expect(select).toBeDefined();
    expect(select).not.toHaveProperty("password");
    expect(Object.keys(select)).toEqual(
      expect.arrayContaining(["id", "name", "email", "role"])
    );
  });

  it("passes an identical where clause to findMany and count", async () => {
    await getPaginatedUsers({ q: "ada", role: "ADMIN" });

    const listWhere = prismaMock.user.findMany.mock.calls[0][0].where;
    const countWhere = prismaMock.user.count.mock.calls[0][0].where;

    expect(countWhere).toEqual(listWhere);
  });

  it("searches name and email case-insensitively", async () => {
    await getPaginatedUsers({ q: "ada" });

    const { where } = prismaMock.user.findMany.mock.calls[0][0];

    expect(where.OR).toEqual([
      { name: { contains: "ada", mode: "insensitive" } },
      { email: { contains: "ada", mode: "insensitive" } },
    ]);
  });

  it("omits the filters entirely when none are supplied", async () => {
    await getPaginatedUsers();

    expect(prismaMock.user.findMany.mock.calls[0][0].where).toEqual({});
  });

  it("orders by a unique tiebreaker so paging cannot repeat or skip rows", async () => {
    await getPaginatedUsers();

    const { orderBy } = prismaMock.user.findMany.mock.calls[0][0];

    expect(orderBy).toEqual([{ createdAt: "desc" }, { id: "asc" }]);
  });

  it("paginates", async () => {
    await getPaginatedUsers({ page: 3, pageSize: 20 });

    const call = prismaMock.user.findMany.mock.calls[0][0];

    expect(call.skip).toBe(40);
    expect(call.take).toBe(20);
  });
});

describe("setUserRole", () => {
  it("requires an admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user_1", role: "USER" } });

    await expect(setUserRole("user_2", "ADMIN")).rejects.toThrow("Unauthorized");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("refuses to let an admin change their own role", async () => {
    await expect(setUserRole("admin_1", "USER")).rejects.toThrow(
      "You can't change your own role."
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("promotes another user", async () => {
    await setUserRole("user_2", "ADMIN");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user_2" },
      data: { role: "ADMIN" },
    });
  });

  it("does not run the last-admin check when promoting", async () => {
    await setUserRole("user_2", "ADMIN");

    expect(prismaMock.user.count).not.toHaveBeenCalled();
  });

  it("demotes another admin while others remain", async () => {
    prismaMock.user.count.mockResolvedValue(1);

    await setUserRole("admin_2", "USER");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "admin_2" },
      data: { role: "USER" },
    });
  });

  it("refuses to demote the last remaining admin", async () => {
    prismaMock.user.count.mockResolvedValue(0);

    await expect(setUserRole("admin_2", "USER")).rejects.toThrow(
      "There must be at least one admin."
    );
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  // Counting ALL admins and testing <= 1 would be unreachable behind the
  // self-check, since the only admin you can be the last of is yourself. The
  // check must exclude the demotion target to be a real invariant.
  it("counts admins other than the demotion target", async () => {
    prismaMock.user.count.mockResolvedValue(1);

    await setUserRole("admin_2", "USER");

    expect(prismaMock.user.count).toHaveBeenCalledWith({
      where: { role: "ADMIN", id: { not: "admin_2" } },
    });
  });

  // count-then-update is TOCTOU; without Serializable two concurrent demotions
  // can both observe "one other admin remains" and lock everyone out.
  it("runs the check and the update in one serializable transaction", async () => {
    prismaMock.user.count.mockResolvedValue(1);

    await setUserRole("admin_2", "USER");

    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(prismaMock.$transaction.mock.calls[0][1]).toEqual({
      isolationLevel: "Serializable",
    });
  });
});
