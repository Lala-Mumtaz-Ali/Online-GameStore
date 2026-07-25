"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Shared query-string writer for the catalogue controls.
 *
 * Extracted so the "changing a filter resets pagination" rule is expressed once
 * rather than repeated in the search box and each select.
 */
export function useGameQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const buildHref = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }

      // Any change to the query narrows or reorders the result set, so the
      // current page number is meaningless afterwards - keeping it would strand
      // the user on "page 4 of 1" with an empty grid.
      params.delete("page");

      const query = params.toString();
      return `/games${query ? `?${query}` : ""}`;
    },
    [searchParams]
  );

  const apply = useCallback(
    (updates: Record<string, string | undefined>) => {
      const href = buildHref(updates);

      startTransition(() => {
        // While already browsing /games, replace: otherwise every keystroke
        // leaves its own history entry and Back becomes unusable. Arriving from
        // another page pushes once, so Back still returns there.
        if (pathname === "/games") router.replace(href, { scroll: false });
        else router.push(href);
      });
    },
    [buildHref, pathname, router]
  );

  return { searchParams, apply, isPending };
}
