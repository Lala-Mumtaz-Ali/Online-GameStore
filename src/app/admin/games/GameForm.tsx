"use client";

import { useActionState } from "react";
import type { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import type { GameFormState } from "./actions";

const inputClassName =
  "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

type GameFormProps = {
  categories: Category[];
  action: (
    state: GameFormState,
    formData: FormData
  ) => Promise<GameFormState>;
  defaultValues?: {
    slug: string;
    title: string;
    description: string;
    price: number;
    releaseDate: string;
    imageUrl: string;
    categorySlugs: string[];
  };
  submitLabel: string;
};

export function GameForm({
  categories,
  action,
  defaultValues,
  submitLabel,
}: GameFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={defaultValues?.title}
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
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description}
          required
          rows={4}
          className={inputClassName}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="price" className="text-sm font-medium">
          Price
        </label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues?.price}
          required
          className={inputClassName}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="releaseDate" className="text-sm font-medium">
          Release Date
        </label>
        <input
          id="releaseDate"
          name="releaseDate"
          type="date"
          defaultValue={defaultValues?.releaseDate}
          required
          className={inputClassName}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="imageUrl" className="text-sm font-medium">
          Image URL
        </label>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          defaultValue={defaultValues?.imageUrl}
          placeholder="https://..."
          className={inputClassName}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Categories</legend>
        {categories.map((category) => (
          <label
            key={category.id}
            className="flex items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              name="categorySlugs"
              value={category.slug}
              defaultChecked={defaultValues?.categorySlugs.includes(
                category.slug
              )}
            />
            {category.name}
          </label>
        ))}
      </fieldset>
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
