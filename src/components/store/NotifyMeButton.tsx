"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToastManager } from "@/components/ui/toast";
import {
  toggleNotifyMeAction,
  type ToggleState,
} from "@/app/(store)/games/[slug]/actions";

export function NotifyMeButton({
  gameId,
  gameTitle,
  initiallyActive,
}: {
  gameId: string;
  gameTitle: string;
  initiallyActive: boolean;
}) {
  const initialState: ToggleState = { active: initiallyActive };
  const [state, formAction, isPending] = useActionState(
    toggleNotifyMeAction.bind(null, gameId),
    initialState
  );
  const toastManager = useToastManager();
  const lastHandled = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!state.timestamp || state.timestamp === lastHandled.current) return;
    lastHandled.current = state.timestamp;

    if (state.error) {
      toastManager.add({
        title: "Couldn't update notification",
        description: state.error,
        type: "error",
      });
    } else if (state.active) {
      toastManager.add({
        title: "You're on the list",
        description: `We'll email you when ${gameTitle} releases.`,
      });
    } else {
      toastManager.add({
        title: "Notification cancelled",
        description: `You won't be notified about ${gameTitle}.`,
      });
    }
  }, [state, gameTitle, toastManager]);

  return (
    <form action={formAction}>
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "..." : state.active ? "Cancel Notify Me" : "Notify Me"}
      </Button>
    </form>
  );
}
