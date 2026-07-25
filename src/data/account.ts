import "server-only";
import prisma from "@/db";
import { requireUser } from "@/data/session";
import { sendVerificationEmail } from "@/data/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

/**
 * Account self-service for the signed-in user.
 *
 * Kept separate from src/data/auth.ts, which owns credentials and tokens, so
 * each domain has its own module the way games/orders/preorders do.
 */

export async function getAccountOverview() {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      // Prisma cannot express "is this column null" in a select, so the hash is
      // read only to derive the boolean below. It never leaves this function.
      password: true,
      _count: { select: { orders: true } },
    },
  });

  if (!user) throw new Error("Account not found.");

  const { password, _count, ...rest } = user;

  return {
    ...rest,
    hasPassword: password !== null,
    orderCount: _count.orders,
  };
}

export async function updateDisplayName(name: string) {
  const user = await requireUser();

  await prisma.user.update({
    where: { id: user.id },
    data: { name },
  });
}

export async function changePassword({
  currentPassword,
  newPassword,
}: {
  currentPassword?: string;
  newPassword: string;
}) {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { password: true },
  });

  if (!user) throw new Error("Account not found.");

  // A Google-only account has no password to confirm against, so it is setting
  // one for the first time rather than changing it. Mirrors authorize(), which
  // already treats a null password as "cannot sign in with credentials".
  if (user.password !== null) {
    if (!currentPassword) {
      throw new Error("Enter your current password.");
    }
    const matches = await verifyPassword(currentPassword, user.password);
    if (!matches) {
      throw new Error("Your current password is incorrect.");
    }
  }

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { password: await hashPassword(newPassword) },
  });
}

export async function resendVerificationEmail() {
  const sessionUser = await requireUser();

  // Refetched because the session token does not carry emailVerified.
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, emailVerified: true },
  });

  if (!user?.email) throw new Error("Your account has no email address.");
  if (user.emailVerified) throw new Error("Your email is already verified.");

  // Safe to reuse as-is: sendVerificationEmail deletes pending rows for this
  // address, which only ever affects verification tokens now that password
  // resets live in their own table.
  await sendVerificationEmail(user.email, user.name);
}
