"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToastManager } from "@/components/ui/toast";
import { setUserRoleAction, type SetUserRoleState } from "./actions";

const initialState: SetUserRoleState = {};

export function UserRoleForm({
  userId,
  currentRole,
  userLabel,
  isSelf,
}: {
  userId: string;
  currentRole: "USER" | "ADMIN";
  userLabel: string;
  /** Server-side setUserRole rejects this too; disabling is belt and braces. */
  isSelf: boolean;
}) {
  const nextRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
  const [state, formAction, pending] = useActionState(
    setUserRoleAction.bind(null, userId),
    initialState
  );
  const toastManager = useToastManager();
  const lastHandled = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!state.timestamp || state.timestamp === lastHandled.current) return;
    lastHandled.current = state.timestamp;

    if (state.success) {
      toastManager.add({
        title: nextRole === "ADMIN" ? "Promoted to admin" : "Demoted to customer",
        description: `${userLabel} takes effect within a few minutes, or immediately on their next sign-in.`,
      });
    } else if (state.error) {
      toastManager.add({
        title: "Couldn't change role",
        description: state.error,
        type: "error",
      });
    }
  }, [state, toastManager, nextRole, userLabel]);

  return (
    <form action={formAction}>
      <input type="hidden" name="role" value={nextRole} />
      <Button
        type="submit"
        variant={nextRole === "ADMIN" ? "outline" : "destructive"}
        size="sm"
        disabled={pending || isSelf}
      >
        {pending ? "Saving..." : nextRole === "ADMIN" ? "Make admin" : "Make customer"}
      </Button>
    </form>
  );
}
