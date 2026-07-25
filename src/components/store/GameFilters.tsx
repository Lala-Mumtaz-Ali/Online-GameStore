"use client";

import Link from "next/link";
import { GAME_SORTS, GAME_SORT_LABELS, type GameSort } from "@/lib/gameQuery";
import { useGameQueryParams } from "./useGameQueryParams";

const selectClassName =
  "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function GameFilters({
  categories,
  genre,
  sort,
  hasFilters,
}: {
  categories: { id: string; name: string; slug: string }[];
  genre: string | undefined;
  sort: GameSort;
  hasFilters: boolean;
}) {
  const { apply, isPending } = useGameQueryParams();

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3" aria-busy={isPending}>
      <div className="flex flex-col gap-1">
        <label htmlFor="genre" className="text-xs font-medium text-muted-foreground">
          Genre
        </label>
        <select
          id="genre"
          value={genre ?? ""}
          onChange={(event) => apply({ genre: event.target.value || undefined })}
          className={selectClassName}
        >
          <option value="">All genres</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sort" className="text-xs font-medium text-muted-foreground">
          Sort by
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(event) => apply({ sort: event.target.value })}
          className={selectClassName}
        >
          {GAME_SORTS.map((option) => (
            <option key={option} value={option}>
              {GAME_SORT_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <Link href="/games" className="pb-2 text-sm underline">
          Clear filters
        </Link>
      )}
    </div>
  );
}
