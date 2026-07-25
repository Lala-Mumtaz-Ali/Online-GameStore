"use server";

import { z } from "zod";
import { requestPasswordReset } from "@/data/auth";

const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email"),
});

export type ForgotPasswordState = {
  error?: string;
  success?: boolean;
};

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Intentionally reports success regardless of whether the account exists, and
  // regardless of whether the throttle silently dropped the request. Branching
  // here would turn this form into a user-enumeration oracle.
  await requestPasswordReset(parsed.data.email);

  return { success: true };
}
