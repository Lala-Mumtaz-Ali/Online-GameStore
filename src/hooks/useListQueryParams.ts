"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Shared query-string writer for filterable list pages (the catalogue and the
 * admin user list).
 *
 * Extracted so the "changing a filter resets pagination" rule is expressed once
 * rather than repeated in every search box and select.
 *
 * Any component using this reads useSearchParams, so it MUST be rendered inside
 * a <Suspense> boundary - without one, Next opts the whole enclosing route into
 * client-side rendering.
 */
export function useListQueryParams(basePath: string) {
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

      // Any change to the query narrows or reorders the results, so the current
      // page number is meaningless afterwards - keeping it would strand the
      // user on "page 4 of 1" with an empty list.
      params.delete("page");

      const query = params.toString();
      return `${basePath}${query ? `?${query}` : ""}`;
    },
    [searchParams, basePath]
  );

  const apply = useCallback(
    (updates: Record<string, string | undefined>) => {
      const href = buildHref(updates);

      startTransition(() => {
        // Already on the list page: replace, so a debounced search box does not
        // leave one history entry per keystroke. Arriving from elsewhere pushes
        // once, so Back still returns where the user came from.
        if (pathname === basePath) router.replace(href, { scroll: false });
        else router.push(href);
      });
    },
    [buildHref, pathname, router, basePath]
  );

  return { searchParams, apply, isPending };
}
