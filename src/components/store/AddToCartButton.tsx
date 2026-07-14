"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToastManager } from "@/components/ui/toast";
import { addToCartAction, type AddToCartState } from "@/app/(store)/cart/actions";

const initialState: AddToCartState = { success: false };

export function AddToCartButton({
  gameId,
  gameTitle,
}: {
  gameId: string;
  gameTitle: string;
}) {
  const [state, formAction, isPending] = useActionState(
    addToCartAction.bind(null, gameId),
    initialState
  );
  const toastManager = useToastManager();
  const lastHandled = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!state.timestamp || state.timestamp === lastHandled.current) {
      return;
    }
    lastHandled.current = state.timestamp;

    if (state.success) {
      toastManager.add({
        title: "Added to cart",
        description: `${gameTitle} has been added to your cart.`,
      });
    } else if (state.error) {
      toastManager.add({
        title: "Couldn't add to cart",
        description: state.error,
        type: "error",
      });
    }
  }, [state, gameTitle, toastManager]);

  return (
    <form action={formAction}>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding..." : "Add to Cart"}
      </Button>
    </form>
  );
}
