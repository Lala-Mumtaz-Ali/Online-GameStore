"use client";

import { useEffect, useState } from "react";
import { useListQueryParams } from "@/hooks/useListQueryParams";

const DEBOUNCE_MS = 300;

/**
 * Debounced catalogue search.
 *
 * Uses useSearchParams, so every render site MUST wrap this in <Suspense> -
 * without a boundary Next opts the whole enclosing route into client-side
 * rendering.
 */
export function GameSearchInput({ className }: { className?: string }) {
  const { searchParams, apply, isPending } = useListQueryParams("/games");
  const currentQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(currentQuery);

  useEffect(() => {
    // Nothing to do when the box already agrees with the URL. This is what
    // stops a navigation firing on mount, and on back/forward navigation.
    if (value === currentQuery) return;

    const timer = setTimeout(() => apply({ q: value.trim() || undefined }), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, currentQuery, apply]);

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
