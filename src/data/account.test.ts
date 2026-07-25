import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prismaMock";

const { mockAuth, mockSendVerificationEmail } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockSendVerificationEmail: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/db", async () => ({
  default: (await import("@/test/prismaMock")).prismaMock,
}));
vi.mock("@/data/auth", () => ({ sendVerificationEmail: mockSendVerificationEmail }));

const { getAccountOverview, changePassword, resendVerificationEmail, updateDisplayName } =
  await import("@/data/account");
const { hashPassword } = await import("@/lib/password");

const SESSION = { user: { id: "user_1", role: "USER" } };

beforeEach(() => {
  mockAuth.mockReset();
  mockSendVerificationEmail.mockReset();
  resetPrismaMock();
  mockAuth.mockResolvedValue(SESSION);
});

describe("authorization", () => {
  it("every account function requires a signed-in user", async () => {
    mockAuth.mockResolvedValue(null);
    const signedOut = "You must be signed in to do that.";

    await expect(getAccountOverview()).rejects.toThrow(signedOut);
    await expect(updateDisplayName("Ada")).rejects.toThrow(signedOut);
    await expect(changePassword({ newPassword: "long-enough-pw" })).rejects.toThrow(
      signedOut
    );
    await expect(resendVerificationEmail()).rejects.toThrow(signedOut);

    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("scopes every write to the session user, never to a client-supplied id", async () => {
    await updateDisplayName("Ada");

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user_1" } })
    );
  });
});

describe("getAccountOverview", () => {
  const base = {
    id: "user_1",
    name: "Ada",
    email: "ada@example.com",
    role: "USER",
    emailVerified: null,
    createdAt: new Date("2026-01-01"),
    _count: { orders: 3 },
  };

  it("reduces the password hash to a boolean and never returns it", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...base, password: "$2b$12$hash" });

    const account = await getAccountOverview();

    expect(account.hasPassword).toBe(true);
    expect(account).not.toHaveProperty("password");
    expect(JSON.stringify(account)).not.toContain("$2b$12$");
  });

  it("reports hasPassword false for a Google-only account", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...base, password: null });

    await expect(getAccountOverview()).resolves.toMatchObject({ hasPassword: false });
  });

  it("flattens the order count", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...base, password: null });

    const account = await getAccountOverview();

    expect(account.orderCount).toBe(3);
    expect(account).not.toHaveProperty("_count");
  });
});

describe("changePassword", () => {
  it("requires the current password when one is set", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: "$2b$12$hash" });

    await expect(changePassword({ newPassword: "long-enough-pw" })).rejects.toThrow(
      "Enter your current password."
    );
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects an incorrect current password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      password: await hashPassword("the-real-password"),
    });

    await expect(
      changePassword({ currentPassword: "wrong", newPassword: "long-enough-pw" })
    ).rejects.toThrow("Your current password is incorrect.");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("stores a bcrypt hash when the current password checks out", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      password: await hashPassword("the-real-password"),
    });

    await changePassword({
      currentPassword: "the-real-password",
      newPassword: "long-enough-pw",
    });

    const { password } = prismaMock.user.update.mock.calls[0][0].data;
    expect(password).not.toBe("long-enough-pw");
    expect(password).toMatch(/^\$2[aby]\$12\$/);
  });

  // A Google-only account has nothing to confirm against, so it is setting a
  // password for the first time rather than changing one.
  it("lets a Google-only account set a password with no current password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: null });

    await changePassword({ newPassword: "long-enough-pw" });

    expect(prismaMock.user.update).toHaveBeenCalledOnce();
  });
});

describe("resendVerificationEmail", () => {
  it("refuses when the address is already verified", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      name: "Ada",
      email: "ada@example.com",
      emailVerified: new Date(),
    });

    await expect(resendVerificationEmail()).rejects.toThrow(
      "Your email is already verified."
    );
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("sends when the address is unverified", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      name: "Ada",
      email: "ada@example.com",
      emailVerified: null,
    });

    await resendVerificationEmail();

    expect(mockSendVerificationEmail).toHaveBeenCalledWith("ada@example.com", "Ada");
  });
});
