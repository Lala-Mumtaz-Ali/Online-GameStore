/**
 * Date-bucketing helpers for the admin analytics trends.
 *
 * Extracted from `src/data/analytics.ts` because this is pure logic that touches
 * neither Prisma nor the session — welding it to a `server-only` module made it
 * impossible to exercise without mocking a database it never uses.
 */

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Bucket `rows` into one entry per day for the last `days` days, inclusive of
 * today, with empty days zero-filled so charts have no gaps.
 *
 * `now` is injectable purely so tests are not time-dependent — a suite asserting
 * "the last bucket is today" would otherwise fail once a day at midnight UTC.
 */
export function buildDailySeries<T extends object>(
  days: number,
  rows: { createdAt: Date }[],
  bucket: (acc: Map<string, T>, key: string, row: { createdAt: Date }) => void,
  empty: T,
  now: Date = new Date()
) {
  const buckets = new Map<string, T>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    // NOTE: `empty` is stored by reference, so every bucket starts out as the
    // *same* object. That is safe only because each `bucket` callback replaces
    // the whole entry via `acc.set(...)`. A callback that mutated the value in
    // place would corrupt every other day.
    buckets.set(dateKey(d), empty);
  }

  for (const row of rows) {
    const key = dateKey(row.createdAt);
    if (buckets.has(key)) {
      bucket(buckets, key, row);
    }
  }

  return Array.from(buckets.entries()).map(([date, value]) => ({ date, ...value }));
}
