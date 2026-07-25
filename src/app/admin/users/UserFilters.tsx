"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useDebouncedQueryInput } from "@/hooks/useDebouncedQueryInput";
import { useListQueryParams } from "@/hooks/useListQueryParams";

const controlClassName =
  "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function UserFilters({
  q,
  role,
  hasFilters,
}: {
  q: string | undefined;
  role: string | undefined;
  hasFilters: boolean;
}) {
  const { apply, isPending } = useListQueryParams("/admin/users");

  const commit = useCallback(
    (query: string) => apply({ q: query || undefined }),
    [apply]
  );

  const [value, setValue] = useDebouncedQueryInput(q ?? "", commit);

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3" aria-busy={isPending}>
      <div className="flex flex-col gap-1">
        <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
          Search
        </label>
        <input
          id="q"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Name or email"
          className={controlClassName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-xs font-medium text-muted-foreground">
          Role
        </label>
        <select
          id="role"
          value={role ?? ""}
          onChange={(event) => apply({ role: event.target.value || undefined })}
          className={controlClassName}
        >
          <option value="">All roles</option>
          <option value="USER">Customer</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {hasFilters && (
        <Link href="/admin/users" className="pb-2 text-sm underline">
          Clear filters
        </Link>
      )}
    </div>
  );
}
