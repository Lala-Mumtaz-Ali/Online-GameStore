import { z } from "zod";

/**
 * Parsing and validation for the /games query string.
 *
 * Everything here is pure so it can be unit-tested, and every function is
 * total: a junk query param falls back to a default rather than throwing. A
 * public catalogue page should never 500 because someone edited the URL bar.
 */

export const GAME_SORTS = ["title", "price-asc", "price-desc", "newest"] as const;
export type GameSort = (typeof GAME_SORTS)[number];

export const GAME_SORT_LABELS: Record<GameSort, string> = {
  title: "Title (A–Z)",
  "price-asc": "Price (low to high)",
  "price-desc": "Price (high to low)",
  newest: "Newest first",
};

// .catch() rather than parse-or-throw, for the reason above.
const gameSortSchema = z.enum(GAME_SORTS).catch("title");

export function parseGameSort(value: unknown): GameSort {
  return gameSortSchema.parse(value);
}

/** Next hands back an array when a param is repeated (?q=a&q=b). */
function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseSearchQuery(
  value: string | string[] | undefined
): string | undefined {
  const trimmed = (firstValue(value) ?? "").trim();
  if (trimmed.length === 0) return undefined;
  // Capped so the URL can't inject an unbounded ILIKE pattern.
  return trimmed.slice(0, 100);
}

export function parseGenreSlug(value: string | string[] | undefined): string | undefined {
  const trimmed = (firstValue(value) ?? "").trim();
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed) ? trimmed : undefined;
}
