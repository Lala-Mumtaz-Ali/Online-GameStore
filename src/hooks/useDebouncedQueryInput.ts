"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Local text state for a search box that writes a debounced value into the URL.
 *
 * The hard part is not the debounce, it is deciding who wins when the URL and
 * the box disagree. Comparing them directly is wrong, because "they differ"
 * has two opposite causes:
 *
 *   - the user typed, and the URL has not caught up yet  -> write the URL
 *   - the URL changed underneath us                      -> adopt it
 *
 * Treating the second case as the first produces a feedback loop. That is
 * exactly what happened when two copies of the catalogue search box were
 * mounted at once (one in the navbar, one on /games, each hidden at a different
 * breakpoint but both live): typing in one wrote `?q=ass`, the other saw a URL
 * that disagreed with its own empty box and wrote the query back off, and the
 * page flipped between the two states indefinitely. The same bug sent the back
 * button forward again, since a stale box re-applied the query it still held.
 *
 * `syncedValue` breaks the tie by remembering the last value this input either
 * wrote or adopted. A URL that differs from it changed elsewhere and is
 * authoritative; text that differs from it is genuinely new input.
 */
export function useDebouncedQueryInput(
  currentValue: string,
  commit: (value: string) => void,
  delayMs = 300
) {
  const [value, setValue] = useState(currentValue);
  const syncedValue = useRef(currentValue);

  // Adopt changes that came from anywhere other than this input: back/forward,
  // a genre link, "Clear filters", or another copy of this component.
  useEffect(() => {
    if (currentValue === syncedValue.current) return;
    syncedValue.current = currentValue;
    setValue(currentValue);
  }, [currentValue]);

  // Write genuinely new input, debounced.
  useEffect(() => {
    // Compared trimmed, so trailing whitespace cannot look like a pending
    // change forever and re-commit the same query on every render.
    const trimmed = value.trim();
    if (trimmed === syncedValue.current) return;

    const timer = setTimeout(() => {
      syncedValue.current = trimmed;
      commit(trimmed);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, commit, delayMs]);

  return [value, setValue] as const;
}
