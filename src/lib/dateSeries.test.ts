import { describe, expect, it } from "vitest";
import { buildDailySeries, dateKey } from "@/lib/dateSeries";

// Fixed clock: every assertion below would otherwise be time-dependent and fail
// once a day at midnight UTC.
const NOW = new Date("2026-07-25T12:00:00.000Z");

function signups(rows: { createdAt: Date }[], days = 7) {
  return buildDailySeries<{ signups: number }>(
    days,
    rows,
    (acc, key) => acc.set(key, { signups: acc.get(key)!.signups + 1 }),
    { signups: 0 },
    NOW
  );
}

describe("dateKey", () => {
  it("formats as YYYY-MM-DD in UTC", () => {
    expect(dateKey(new Date("2026-07-25T23:59:59.000Z"))).toBe("2026-07-25");
  });
});

describe("buildDailySeries", () => {
  it("returns exactly one bucket per day", () => {
    expect(signups([], 7)).toHaveLength(7);
    expect(signups([], 30)).toHaveLength(30);
  });

  it("ends on today and starts days-1 back", () => {
    const series = signups([], 7);
    expect(series[series.length - 1].date).toBe("2026-07-25");
    expect(series[0].date).toBe("2026-07-19");
  });

  it("produces contiguous ascending dates with no gaps", () => {
    const dates = signups([], 30).map((point) => point.date);

    expect([...dates].sort()).toEqual(dates);
    for (let i = 1; i < dates.length; i++) {
      const gap = Date.parse(dates[i]) - Date.parse(dates[i - 1]);
      expect(gap).toBe(24 * 60 * 60 * 1000);
    }
  });

  it("zero-fills days with no rows so charts have no holes", () => {
    expect(signups([], 3).every((point) => point.signups === 0)).toBe(true);
  });

  it("aggregates multiple rows landing on the same day", () => {
    const series = signups([
      { createdAt: new Date("2026-07-24T01:00:00.000Z") },
      { createdAt: new Date("2026-07-24T22:00:00.000Z") },
    ]);

    expect(series.find((point) => point.date === "2026-07-24")?.signups).toBe(2);
  });

  it("drops rows outside the window instead of throwing", () => {
    const series = signups([
      { createdAt: new Date("2020-01-01T00:00:00.000Z") },
      { createdAt: new Date("2026-07-25T00:00:00.000Z") },
    ]);

    expect(series.reduce((sum, point) => sum + point.signups, 0)).toBe(1);
  });

  it("handles a single-day window", () => {
    expect(signups([], 1)).toEqual([{ date: "2026-07-25", signups: 0 }]);
  });

  // Guards the documented hazard in buildDailySeries: `empty` is stored by
  // reference, so every bucket starts as the same object. Callbacks must replace
  // the entry via acc.set(), never mutate it in place. This test fails loudly if
  // someone writes a mutating callback.
  it("keeps days independent when the callback replaces the entry", () => {
    const series = signups([{ createdAt: new Date("2026-07-25T00:00:00.000Z") }], 3);

    expect(series.map((point) => point.signups)).toEqual([0, 0, 1]);
  });
});
