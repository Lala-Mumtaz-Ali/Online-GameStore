import { describe, expect, it } from "vitest";
import {
  GAME_SORTS,
  parseGameSort,
  parseGenreSlug,
  parseSearchQuery,
} from "@/lib/gameQuery";

describe("parseGameSort", () => {
  it("accepts every declared sort", () => {
    for (const sort of GAME_SORTS) {
      expect(parseGameSort(sort)).toBe(sort);
    }
  });

  // The sort value indexes into an orderBy lookup map. Falling back rather than
  // throwing keeps a hand-edited URL from 500-ing a public page.
  it("falls back to title for unknown, missing, or non-string values", () => {
    expect(parseGameSort("bogus")).toBe("title");
    expect(parseGameSort(undefined)).toBe("title");
    expect(parseGameSort(["price-asc"])).toBe("title");
    expect(parseGameSort({ evil: true })).toBe("title");
  });
});

describe("parseSearchQuery", () => {
  it("returns the trimmed query", () => {
    expect(parseSearchQuery("  ronin  ")).toBe("ronin");
  });

  it("treats blank input as no filter at all", () => {
    expect(parseSearchQuery(undefined)).toBeUndefined();
    expect(parseSearchQuery("")).toBeUndefined();
    expect(parseSearchQuery("   ")).toBeUndefined();
  });

  // Passing the raw string[] into Prisma's `contains` throws at runtime.
  it("takes the first value when the param is repeated", () => {
    expect(parseSearchQuery(["ronin", "ember"])).toBe("ronin");
    expect(parseSearchQuery([])).toBeUndefined();
  });

  it("caps the length so the URL cannot supply an unbounded pattern", () => {
    expect(parseSearchQuery("x".repeat(500))).toHaveLength(100);
  });

  it("passes special characters through for Prisma to parameterise", () => {
    expect(parseSearchQuery("zelda & link")).toBe("zelda & link");
    expect(parseSearchQuery("100%")).toBe("100%");
  });
});

describe("parseGenreSlug", () => {
  it("accepts lowercase hyphenated slugs", () => {
    expect(parseGenreSlug("action")).toBe("action");
    expect(parseGenreSlug("role-playing-games")).toBe("role-playing-games");
    expect(parseGenreSlug("4x")).toBe("4x");
  });

  it("rejects anything that is not slug-shaped", () => {
    expect(parseGenreSlug("Action")).toBeUndefined();
    expect(parseGenreSlug("action rpg")).toBeUndefined();
    expect(parseGenreSlug("-action")).toBeUndefined();
    expect(parseGenreSlug("action-")).toBeUndefined();
    expect(parseGenreSlug("action--rpg")).toBeUndefined();
    expect(parseGenreSlug("../../etc/passwd")).toBeUndefined();
    expect(parseGenreSlug(undefined)).toBeUndefined();
  });

  it("takes the first value when the param is repeated", () => {
    expect(parseGenreSlug(["rpg", "action"])).toBe("rpg");
  });
});
