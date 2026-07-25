import { describe, expect, it } from "vitest";
import { buildPageHref, getSkip, getTotalPages, parsePageParam } from "@/lib/pagination";

describe("parsePageParam", () => {
  it("parses a valid page number", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("defaults to 1 for undefined, empty, and non-numeric input", () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("")).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
  });

  it("clamps zero and negative pages to 1", () => {
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-5")).toBe(1);
  });

  // Regression: `Math.max(1, Number(pageParam) || 1)` let a float through, so
  // ?page=2.3 produced skip=26.000000000000004 and Prisma rejected the query.
  it("floors fractional pages instead of passing a float to Prisma", () => {
    expect(parsePageParam("2.3")).toBe(2);
    expect(parsePageParam("1.9")).toBe(1);
    expect(Number.isInteger(getSkip(parsePageParam("2.3"), 20))).toBe(true);
  });

  // Regression: Number("1e400") is Infinity, which also throws in Prisma.
  it("rejects Infinity and NaN", () => {
    expect(parsePageParam("1e400")).toBe(1);
    expect(parsePageParam("NaN")).toBe(1);
  });

  // Next hands back an array when a param is repeated (?page=2&page=5).
  it("takes the first value when the param is repeated", () => {
    expect(parsePageParam(["2", "5"])).toBe(2);
    expect(parsePageParam([])).toBe(1);
  });
});

describe("getTotalPages", () => {
  it("rounds up partial pages", () => {
    expect(getTotalPages(41, 20)).toBe(3);
    expect(getTotalPages(40, 20)).toBe(2);
  });

  it("never returns less than 1, so an empty list is still 'Page 1 of 1'", () => {
    expect(getTotalPages(0, 20)).toBe(1);
  });
});

describe("getSkip", () => {
  it("skips a full page per preceding page", () => {
    expect(getSkip(1, 20)).toBe(0);
    expect(getSkip(3, 20)).toBe(40);
  });

  it("never returns a negative offset", () => {
    expect(getSkip(0, 20)).toBe(0);
  });
});

describe("buildPageHref", () => {
  it("returns the bare path when there is nothing to append", () => {
    expect(buildPageHref("/games", {}, 1)).toBe("/games");
    expect(buildPageHref("/games", undefined, 1)).toBe("/games");
  });

  it("omits page=1 so the first page has one canonical URL", () => {
    expect(buildPageHref("/games", { q: "ronin" }, 1)).toBe("/games?q=ronin");
  });

  // The whole reason this helper exists: the old `?page=${n}` template silently
  // dropped every search, filter, and sort param on Next/Previous.
  it("preserves the other query params", () => {
    const href = buildPageHref("/games", { q: "ronin", genre: "action", sort: "price-asc" }, 2);
    const params = new URLSearchParams(href.split("?")[1]);

    expect(params.get("q")).toBe("ronin");
    expect(params.get("genre")).toBe("action");
    expect(params.get("sort")).toBe("price-asc");
    expect(params.get("page")).toBe("2");
  });

  it("replaces the incoming page rather than duplicating it", () => {
    const href = buildPageHref("/games", { page: "2", q: "ronin" }, 3);
    expect(href.match(/page=/g)).toHaveLength(1);
    expect(new URLSearchParams(href.split("?")[1]).get("page")).toBe("3");
  });

  it("drops empty params so a cleared search box does not linger in the URL", () => {
    expect(buildPageHref("/games", { q: "", genre: "rpg" }, 1)).toBe("/games?genre=rpg");
  });

  it("skips undefined values", () => {
    expect(buildPageHref("/games", { q: undefined, genre: "rpg" }, 1)).toBe("/games?genre=rpg");
  });

  it("preserves repeated params", () => {
    const href = buildPageHref("/games", { genre: ["action", "rpg"] }, 1);
    expect(new URLSearchParams(href.split("?")[1]).getAll("genre")).toEqual(["action", "rpg"]);
  });

  // String concatenation produced a broken URL here; URLSearchParams encodes it.
  it("percent-encodes values that would otherwise break the query string", () => {
    const href = buildPageHref("/games", { q: "zelda & link" }, 2);

    expect(href).not.toContain(" ");
    expect(href).not.toContain("q=zelda & link");
    expect(new URLSearchParams(href.split("?")[1]).get("q")).toBe("zelda & link");
  });
});
