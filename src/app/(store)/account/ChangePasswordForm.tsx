"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToastManager } from "@/components/ui/toast";
import { changePasswordAction, type AccountState } from "./actions";

const initialState: AccountState = {};

const inputClassName =
  "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const toastManager = useToastManager();
  const lastHandled = useRef<number | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.timestamp || state.timestamp === lastHandled.current) return;
    lastHandled.current = state.timestamp;

    if (state.success) {
      toastManager.add({
        title: hasPassword ? "Password changed" : "Password set",
        description: "Use your new password the next time you sign in.",
      });
      formRef.current?.reset();
    } else if (state.error) {
      toastManager.add({
        title: "Couldn't save password",
        description: state.error,
        type: "error",
      });
    }
  }, [state, toastManager, hasPassword]);

  return (
    <form ref={formRef} action={formAction} className="flex max-w-sm flex-col gap-4">
      {hasPassword && (
        <div className="flex flex-col gap-1">
          <label htmlFor="currentPassword" className="text-sm font-medium">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={inputClassName}
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className="text-sm font-medium">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClassName}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClassName}
        />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : hasPassword ? "Change password" : "Set password"}
      </Button>
    </form>
  );
}
