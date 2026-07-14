"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { CategoryFormState } from "./actions";

const inputClassName =
  "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

type CategoryFormProps = {
  action: (
    state: CategoryFormState,
    formData: FormData
  ) => Promise<CategoryFormState>;
  defaultValues?: {
    name: string;
    slug: string;
  };
  submitLabel: string;
};

export function CategoryForm({
  action,
  defaultValues,
  submitLabel,
}: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          required
          className={inputClassName}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={defaultValues?.slug}
          required
          className={inputClassName}
        />
        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens only (used in the URL).
        </p>
      </div>
      {state.error && (
        <p className="text-sm text-destructive" aria-live="polite">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
