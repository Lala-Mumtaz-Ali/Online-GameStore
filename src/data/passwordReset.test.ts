import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prismaMock";

const { mockSendEmail } = vi.hoisted(() => ({ mockSendEmail: vi.fn() }));

vi.mock("@/db", async () => ({
  default: (await import("@/test/prismaMock")).prismaMock,
}));
vi.mock("@/lib/email", () => ({ sendEmail: mockSendEmail }));

const { requestPasswordReset, resetPassword, getPasswordResetContext } =
  await import("@/data/auth");

const USER = { id: "user_1", name: "Ada" };

/** Pull the raw token back out of the email we would have sent. */
function tokenFromLastEmail() {
  const html = mockSendEmail.mock.calls.at(-1)?.[0].html as string;
  return html.match(/reset-password\?token=([a-f0-9]+)/)?.[1];
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

beforeEach(() => {
  resetPrismaMock();
  mockSendEmail.mockReset();
  // Callback-style $transaction: hand the callback the same mock client.
  prismaMock.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
    fn(prismaMock)
  );
});

describe("requestPasswordReset", () => {
  it("is silent for an unknown email: no token, no email, no throw", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(requestPasswordReset("nobody@example.com")).resolves.toBeUndefined();

    expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("issues a token and sends an email for a known account", async () => {
    prismaMock.user.findUnique.mockResolvedValue(USER);
    prismaMock.passwordResetToken.count.mockResolvedValue(0);

    await requestPasswordReset("ada@example.com");

    expect(prismaMock.passwordResetToken.create).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail.mock.calls[0][0].to).toBe("ada@example.com");
  });

  // The token in the email must never be the value stored in the database.
  it("stores only a SHA-256 hash of the emailed token", async () => {
    prismaMock.user.findUnique.mockResolvedValue(USER);
    prismaMock.passwordResetToken.count.mockResolvedValue(0);

    await requestPasswordReset("ada@example.com");

    const emailedToken = tokenFromLastEmail()!;
    const { tokenHash } = prismaMock.passwordResetToken.create.mock.calls[0][0].data;

    expect(emailedToken).toMatch(/^[a-f0-9]{64}$/); // 32 bytes of entropy
    expect(tokenHash).not.toBe(emailedToken);
    expect(tokenHash).toBe(sha256(emailedToken));
  });

  it("sets an expiry an hour out, not the 24h used for email verification", async () => {
    prismaMock.user.findUnique.mockResolvedValue(USER);
    prismaMock.passwordResetToken.count.mockResolvedValue(0);

    const before = Date.now();
    await requestPasswordReset("ada@example.com");
    const after = Date.now();

    const { expires } = prismaMock.passwordResetToken.create.mock.calls[0][0].data;
    const ttl = (expires as Date).getTime();

    // Bracketed by the wall clock either side of the call, so the assertion is
    // exact about the 1h TTL without being sensitive to execution time.
    expect(ttl).toBeGreaterThanOrEqual(before + 1000 * 60 * 60);
    expect(ttl).toBeLessThanOrEqual(after + 1000 * 60 * 60);
  });

  it("throttles after 3 requests in the window, silently", async () => {
    prismaMock.user.findUnique.mockResolvedValue(USER);
    prismaMock.passwordResetToken.count.mockResolvedValue(3);

    await expect(requestPasswordReset("ada@example.com")).resolves.toBeUndefined();

    expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("scopes the throttle to the account, not globally", async () => {
    prismaMock.user.findUnique.mockResolvedValue(USER);
    prismaMock.passwordResetToken.count.mockResolvedValue(0);

    await requestPasswordReset("ada@example.com");

    expect(prismaMock.passwordResetToken.count.mock.calls[0][0].where.userId).toBe(
      USER.id
    );
  });
});

describe("resetPassword", () => {
  const GENERIC = "This reset link is invalid or has expired.";
  const future = () => new Date(Date.now() + 60_000);

  it("looks the token up by hash, never by raw value", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);

    await resetPassword({ token: "raw-token", password: "long-enough-password" });

    expect(prismaMock.passwordResetToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: sha256("raw-token") } })
    );
  });

  it("rejects an unknown token", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);

    const result = await resetPassword({ token: "x", password: "long-enough-password" });

    expect(result).toEqual({ success: false, error: GENERIC });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: USER.id,
      expires: new Date(Date.now() - 1000),
      usedAt: null,
    });

    const result = await resetPassword({ token: "x", password: "long-enough-password" });

    expect(result).toEqual({ success: false, error: GENERIC });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects a token that was already used", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: USER.id,
      expires: future(),
      usedAt: new Date(),
    });

    const result = await resetPassword({ token: "x", password: "long-enough-password" });

    expect(result).toEqual({ success: false, error: GENERIC });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  // Distinguishing these cases would tell an attacker which tokens once existed.
  it("returns an identical message for unknown, expired, and used tokens", async () => {
    const messages: string[] = [];

    for (const record of [
      null,
      { id: "t1", userId: USER.id, expires: new Date(Date.now() - 1000), usedAt: null },
      { id: "t1", userId: USER.id, expires: future(), usedAt: new Date() },
    ]) {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(record);
      const result = await resetPassword({
        token: "x",
        password: "long-enough-password",
      });
      if (!result.success) messages.push(result.error);
    }

    expect(new Set(messages).size).toBe(1);
  });

  describe("on success", () => {
    beforeEach(() => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: "t1",
        userId: USER.id,
        expires: future(),
        usedAt: null,
      });
    });

    it("stores a bcrypt hash, never the plaintext password", async () => {
      await resetPassword({ token: "x", password: "long-enough-password" });

      const { password } = prismaMock.user.update.mock.calls[0][0].data;

      expect(password).not.toBe("long-enough-password");
      expect(password).toMatch(/^\$2[aby]\$12\$/); // bcrypt, cost 12
    });

    it("marks the token used so it cannot be replayed", async () => {
      await resetPassword({ token: "x", password: "long-enough-password" });

      expect(prismaMock.passwordResetToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "t1" } })
      );
      expect(
        prismaMock.passwordResetToken.update.mock.calls[0][0].data.usedAt
      ).toBeInstanceOf(Date);
    });

    it("invalidates every other outstanding reset for that account", async () => {
      await resetPassword({ token: "x", password: "long-enough-password" });

      expect(prismaMock.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: USER.id, usedAt: null },
      });
    });

    it("verifies the email, since completing a reset proves mailbox control", async () => {
      await resetPassword({ token: "x", password: "long-enough-password" });

      expect(prismaMock.user.update.mock.calls[0][0].data.emailVerified).toBeInstanceOf(
        Date
      );
    });

    it("does all three writes inside one transaction", async () => {
      await resetPassword({ token: "x", password: "long-enough-password" });

      expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    });
  });
});

describe("getPasswordResetContext", () => {
  it("returns null for an unusable token rather than throwing", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);

    await expect(getPasswordResetContext("x")).resolves.toBeNull();
  });

  // Google-only accounts have password === null and are setting one, not changing it.
  it("reports whether the account already has a password", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      expires: new Date(Date.now() + 60_000),
      usedAt: null,
      user: { password: null },
    });

    await expect(getPasswordResetContext("x")).resolves.toEqual({ hasPassword: false });
  });

  it("never returns the password hash itself", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      expires: new Date(Date.now() + 60_000),
      usedAt: null,
      user: { password: "$2b$12$somehash" },
    });

    const context = await getPasswordResetContext("x");

    expect(context).toEqual({ hasPassword: true });
    expect(JSON.stringify(context)).not.toContain("$2b$12$");
  });
});
