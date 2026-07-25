import "server-only";
import { createHash, randomBytes } from "node:crypto";
import prisma from "@/db";
import { sendEmail } from "@/lib/email";
import { resetPasswordTemplate, verifyEmailTemplate } from "@/lib/emailTemplates";
import { hashPassword } from "@/lib/password";
import { env } from "@/utils/env";

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h

// Much shorter than the verification TTL above, and deliberately so: an email
// verification link is low-risk, whereas a reset link grants account takeover.
const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1h

// A database-backed throttle. An in-memory limiter would be per-instance on
// serverless and therefore no limit at all; this one is correct across
// instances and costs a single indexed count.
const RESET_REQUEST_WINDOW_MS = 1000 * 60 * 15; // 15m
const MAX_RESET_REQUESTS_PER_WINDOW = 3;

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerUser({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  await sendVerificationEmail(email, name);

  return user;
}

export async function sendVerificationEmail(email: string, name: string | null) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  await sendEmail({
    to: email,
    subject: "Confirm your email - GameStore",
    html: verifyEmailTemplate({ name, token }),
  });
}

export async function verifyEmailToken(token: string) {
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    }
    return {
      success: false as const,
      error: "This verification link is invalid or has expired.",
    };
  }

  await prisma.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.delete({ where: { token } });

  return { success: true as const };
}

/**
 * Start a password reset.
 *
 * Always resolves, and never reveals whether the address has an account: the
 * caller reports the same generic success either way, so this endpoint cannot
 * be used to enumerate users. `sendEmail` is fail-soft too, so a mail provider
 * outage cannot leak existence through an error path.
 *
 * Note there is no bcrypt work on this path (hashing happens only when the
 * reset is completed), so there is no large timing asymmetry to exploit either.
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });
  if (!user) return;

  const recentRequests = await prisma.passwordResetToken.count({
    where: {
      userId: user.id,
      createdAt: { gte: new Date(Date.now() - RESET_REQUEST_WINDOW_MS) },
    },
  });
  if (recentRequests >= MAX_RESET_REQUESTS_PER_WINDOW) return;

  const token = randomBytes(32).toString("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashResetToken(token),
      expires: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
    },
  });

  if (env.NODE_ENV === "development") {
    // Tokens are hashed at rest, so there is otherwise no way to complete this
    // flow locally without a configured Resend key.
    const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    console.log(`[dev] password reset link: ${appUrl}/reset-password?token=${token}`);
  }

  await sendEmail({
    to: email,
    subject: "Reset your password - GameStore",
    html: resetPasswordTemplate({ name: user.name, token }),
  });
}

/**
 * Read-only lookup used to render the reset page. Does NOT consume the token.
 *
 * Returning null for an unusable token lets the page say so up front instead of
 * making the user fill in a form that is guaranteed to fail. This is not an
 * information leak: anyone calling it already holds the secret.
 */
export async function getPasswordResetContext(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    // The password hash is selected only to derive the boolean below; it never
    // leaves this function.
    select: { expires: true, usedAt: true, user: { select: { password: true } } },
  });

  if (!record || record.usedAt || record.expires < new Date()) return null;

  return { hasPassword: record.user.password !== null };
}

/**
 * Complete a password reset.
 *
 * Mirrors verifyEmailToken's discriminated-union return shape. Every failure
 * returns the same message: distinguishing "unknown" from "expired" from
 * "already used" would tell an attacker which tokens once existed.
 *
 * Known limitation: with `strategy: "jwt"` and no server-side session table,
 * this cannot revoke sessions that are already signed in elsewhere. Documented
 * in the README rather than papered over.
 */
export async function resetPassword({
  token,
  password,
}: {
  token: string;
  password: string;
}) {
  const invalid = {
    success: false as const,
    error: "This reset link is invalid or has expired.",
  };

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { id: true, userId: true, expires: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expires < new Date()) return invalid;

  const hashedPassword = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    await tx.user.update({
      where: { id: record.userId },
      data: {
        password: hashedPassword,
        // Completing a reset proves control of the mailbox, so it is a valid
        // verification signal. This also rescues accounts that registered but
        // never clicked the original verification link.
        emailVerified: new Date(),
      },
    });

    // Any other outstanding reset for this account is now void.
    await tx.passwordResetToken.deleteMany({
      where: { userId: record.userId, usedAt: null },
    });
  });

  return { success: true as const };
}
