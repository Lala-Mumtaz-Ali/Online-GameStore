"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToastManager } from "@/components/ui/toast";
import {
  togglePreorderAction,
  type ToggleState,
} from "@/app/(store)/games/[slug]/actions";

export function PreorderButton({
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
    togglePreorderAction.bind(null, gameId),
    initialState
  );
  const toastManager = useToastManager();
  const lastHandled = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!state.timestamp || state.timestamp === lastHandled.current) return;
    lastHandled.current = state.timestamp;

    if (state.error) {
      toastManager.add({
        title: "Couldn't update preorder",
        description: state.error,
        type: "error",
      });
    } else if (state.active) {
      toastManager.add({
        title: "Preorder placed",
        description: `You'll be charged automatically and receive ${gameTitle} the moment it releases.`,
      });
    } else {
      toastManager.add({
        title: "Preorder cancelled",
        description: `Your preorder for ${gameTitle} was cancelled.`,
      });
    }
  }, [state, gameTitle, toastManager]);

  return (
    <form action={formAction}>
      <Button
        type="submit"
        variant={state.active ? "outline" : "default"}
        disabled={isPending}
      >
        {isPending ? "..." : state.active ? "Cancel Preorder" : "Preorder"}
      </Button>
    </form>
  );
}
