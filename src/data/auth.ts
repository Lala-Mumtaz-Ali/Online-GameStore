import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import prisma from "@/db";
import { sendEmail } from "@/lib/email";
import { verifyEmailTemplate } from "@/lib/emailTemplates";

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h

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

  const hashedPassword = await bcrypt.hash(password, 12);

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
