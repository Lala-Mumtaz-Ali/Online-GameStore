"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

const inputClassName =
  "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  // Replaces the form rather than redirecting, so the confirmation copy stays
  // on screen. The (auth) group has no ToastProvider, so feedback is inline.
  if (state.success) {
    return (
      <div className="rounded-xl border p-6">
        <h1 className="mb-2 text-2xl font-bold">Check your email</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          If an account exists for that address, we&apos;ve sent a link to reset your
          password. The link expires in 1 hour.
        </p>
        <Link href="/login" className="text-sm underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6">
      <h1 className="mb-2 text-2xl font-bold">Forgot your password?</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Enter the email address on your account and we&apos;ll send you a reset link.
      </p>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClassName}
          />
        </div>
        {state.error && (
          <p className="text-sm text-destructive" aria-live="polite">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
