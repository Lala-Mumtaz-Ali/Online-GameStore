"use client";

import { useCallback } from "react";
import { useDebouncedQueryInput } from "@/hooks/useDebouncedQueryInput";
import { useListQueryParams } from "@/hooks/useListQueryParams";

/**
 * Debounced catalogue search.
 *
 * Uses useSearchParams, so every render site MUST wrap this in <Suspense> -
 * without a boundary Next opts the whole enclosing route into client-side
 * rendering.
 *
 * Two copies of this are mounted on /games (navbar above `sm`, page below).
 * useDebouncedQueryInput is what keeps them from fighting each other over the
 * query string - see the comment there.
 */
export function GameSearchInput({ className }: { className?: string }) {
  const { searchParams, apply, isPending } = useListQueryParams("/games");
  const currentQuery = searchParams.get("q") ?? "";

  const commit = useCallback(
    (query: string) => apply({ q: query || undefined }),
    [apply]
  );

  const [value, setValue] = useDebouncedQueryInput(currentQuery, commit);

  return (
    <input
      type="search"
      name="q"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="Search games..."
      aria-label="Search games"
      aria-busy={isPending}
      className={`rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
        isPending ? "opacity-70" : ""
      } ${className ?? ""}`}
    />
  );
}
