"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useToastManager } from "@/components/ui/toast";
import { updateProfileAction, type AccountState } from "./actions";

const initialState: AccountState = {};

const inputClassName =
  "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function ProfileForm({ name }: { name: string | null }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const toastManager = useToastManager();
  const router = useRouter();
  const { update } = useSession();
  const lastHandled = useRef<number | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.timestamp || state.timestamp === lastHandled.current) return;
    lastHandled.current = state.timestamp;

    if (state.success) {
      toastManager.add({
        title: "Profile updated",
        description: "Your display name has been saved.",
      });

      // Sessions are JWTs, so the navbar would keep rendering the old name
      // until the token was reissued. update() reissues the cookie and
      // refresh() makes the server components re-read it.
      const nextName = formRef.current?.elements.namedItem("name");
      if (nextName instanceof HTMLInputElement) {
        void update({ name: nextName.value }).then(() => router.refresh());
      }
    } else if (state.error) {
      toastManager.add({
        title: "Couldn't update profile",
        description: state.error,
        type: "error",
      });
    }
  }, [state, toastManager, update, router]);

  return (
    <form ref={formRef} action={formAction} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Display name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={80}
          defaultValue={name ?? ""}
          className={inputClassName}
        />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
