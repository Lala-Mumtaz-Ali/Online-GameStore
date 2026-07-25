/**
 * Pure pagination helpers shared by the admin lists and the storefront catalogue.
 *
 * These live outside the `Pagination` component (and outside `src/data/`) so they
 * can be unit-tested without React or a database.
 */

/**
 * Coerce a `page` query param into a usable 1-based page number.
 *
 * Query params are untrusted: Next hands back `string[]` for a repeated param
 * (`?page=1&page=2`), and `Number()` happily produces floats and `Infinity`.
 * Passing either straight through to Prisma's `skip` throws at runtime, so
 * anything that isn't a finite number falls back to page 1.
 */
export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
}

/** Always at least 1, so an empty list still renders as "Page 1 of 1". */
export function getTotalPages(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

export function getSkip(page: number, pageSize: number): number {
  return Math.max(0, (page - 1) * pageSize);
}

/**
 * Build a pagination link that preserves every other query param.
 *
 * Naive `${basePath}?page=${n}` string concatenation drops the current search,
 * filter, and sort params, and produces a broken URL for anything needing
 * percent-encoding. `URLSearchParams` handles both.
 */
export function buildPageHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined> | undefined,
  page: number
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    // Drop the incoming `page` so it can't end up duplicated as ?page=2&page=3.
    if (key === "page" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== "") params.append(key, item);
    }
  }

  // page=1 is omitted so the first page has a single canonical URL.
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
