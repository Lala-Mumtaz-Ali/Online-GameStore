"use server";

import { z } from "zod";
import { resetPassword } from "@/data/auth";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordState = {
  error?: string;
  success?: boolean;
};

/**
 * `token` is bound with .bind(null, token) rather than carried in a hidden
 * input, matching the existing addToCartAction pattern and keeping the token
 * out of the rendered DOM.
 */
export async function resetPasswordAction(
  token: string,
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  if (!token) {
    return { error: "This reset link is invalid or has expired." };
  }

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await resetPassword({ token, password: parsed.data.password });

  if (!result.success) {
    return { error: result.error };
  }

  // Deliberately does not sign the user in. Requiring an explicit login after a
  // reset is the safer posture and avoids re-deriving the account from a token
  // that has just been consumed.
  return { success: true };
}
