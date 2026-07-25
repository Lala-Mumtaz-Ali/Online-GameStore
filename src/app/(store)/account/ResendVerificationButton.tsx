"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToastManager } from "@/components/ui/toast";
import { resendVerificationAction, type AccountState } from "./actions";

const initialState: AccountState = {};

export function ResendVerificationButton() {
  const [state, formAction, pending] = useActionState(
    resendVerificationAction,
    initialState
  );
  const toastManager = useToastManager();
  const lastHandled = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!state.timestamp || state.timestamp === lastHandled.current) return;
    lastHandled.current = state.timestamp;

    if (state.success) {
      toastManager.add({
        title: "Verification email sent",
        description: "Check your inbox for the confirmation link.",
      });
    } else if (state.error) {
      toastManager.add({
        title: "Couldn't send email",
        description: state.error,
        type: "error",
      });
    }
  }, [state, toastManager]);

  return (
    <form action={formAction}>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Sending..." : "Resend verification email"}
      </Button>
    </form>
  );
}
