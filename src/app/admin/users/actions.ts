"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { setUserRole } from "@/data/users";

const setRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export type SetUserRoleState = {
  error?: string;
  success?: boolean;
  timestamp?: number;
};

/**
 * The user id is bound (matching addToCartAction.bind(null, gameId)), but the
 * requested role travels through FormData so it is validated by Zod like every
 * other input. Next encrypts bound closure arguments, but that is a transport
 * detail, not an authorization boundary to lean on.
 */
export async function setUserRoleAction(
  userId: string,
  _prevState: SetUserRoleState,
  formData: FormData
): Promise<SetUserRoleState> {
  const parsed = setRoleSchema.safeParse({ role: formData.get("role") });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      timestamp: Date.now(),
    };
  }

  try {
    await setUserRole(userId, parsed.data.role);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update role",
      timestamp: Date.now(),
    };
  }

  revalidatePath("/admin/users");

  return { success: true, timestamp: Date.now() };
}
