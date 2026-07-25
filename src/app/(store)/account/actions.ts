"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  changePassword,
  resendVerificationEmail,
  updateDisplayName,
} from "@/data/account";

/** timestamp lets the client fire a toast even when the same result repeats. */
export type AccountState = {
  error?: string;
  success?: boolean;
  timestamp?: number;
};

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(80, "Name is too long"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function updateProfileAction(
  _prevState: AccountState,
  formData: FormData
): Promise<AccountState> {
  const parsed = profileSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      timestamp: Date.now(),
    };
  }

  try {
    await updateDisplayName(parsed.data.name);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update profile",
      timestamp: Date.now(),
    };
  }

  revalidatePath("/account");
  // The navbar renders the user's name, and it lives in the root layout.
  revalidatePath("/", "layout");

  return { success: true, timestamp: Date.now() };
}

export async function changePasswordAction(
  _prevState: AccountState,
  formData: FormData
): Promise<AccountState> {
  const currentPassword = formData.get("currentPassword");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: typeof currentPassword === "string" ? currentPassword : undefined,
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      timestamp: Date.now(),
    };
  }

  try {
    await changePassword({
      currentPassword: parsed.data.currentPassword || undefined,
      newPassword: parsed.data.newPassword,
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to change password",
      timestamp: Date.now(),
    };
  }

  revalidatePath("/account");

  return { success: true, timestamp: Date.now() };
}

export async function resendVerificationAction(
  _prevState: AccountState,
  _formData: FormData
): Promise<AccountState> {
  try {
    await resendVerificationEmail();
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to send verification email",
      timestamp: Date.now(),
    };
  }

  return { success: true, timestamp: Date.now() };
}
