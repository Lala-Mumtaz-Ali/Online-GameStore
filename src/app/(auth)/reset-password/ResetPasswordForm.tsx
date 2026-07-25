"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

const inputClassName =
  "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function ResetPasswordForm({
  token,
  hasPassword,
}: {
  token: string;
  /** False for Google-only accounts, which are setting a password for the first time. */
  hasPassword: boolean;
}) {
  const boundAction = resetPasswordAction.bind(null, token);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-xl border p-6">
        <h1 className="mb-2 text-2xl font-bold">Password updated</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          You can now sign in with your new password.
        </p>
        <Link href="/login" className="text-sm underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6">
      <h1 className="mb-2 text-2xl font-bold">
        {hasPassword ? "Choose a new password" : "Set a password"}
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {hasPassword
          ? "Pick something you haven't used here before."
          : "This account signs in with Google. Setting a password lets you sign in with your email as well."}
      </p>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            New password
          </label>
          <input
            id="password"
            name="password"
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
        {state.error && (
          <p className="text-sm text-destructive" aria-live="polite">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving..." : hasPassword ? "Update password" : "Set password"}
        </Button>
      </form>
    </div>
  );
}
