import Link from "next/link";
import { buildPageHref } from "@/lib/pagination";

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  /**
   * The page's current query params. Everything except `page` is carried
   * through, so paging never silently drops an active search or filter.
   */
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);
  const linkClass = "rounded-lg border px-3 py-1.5 text-sm hover:bg-muted";
  const disabledClass = "pointer-events-none opacity-50";

  return (
    <div className="mt-4 flex items-center justify-between">
      <Link
        href={buildPageHref(basePath, searchParams, prevPage)}
        aria-disabled={page <= 1}
        className={`${linkClass} ${page <= 1 ? disabledClass : ""}`}
      >
        Previous
      </Link>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Link
        href={buildPageHref(basePath, searchParams, nextPage)}
        aria-disabled={page >= totalPages}
        className={`${linkClass} ${page >= totalPages ? disabledClass : ""}`}
      >
        Next
      </Link>
    </div>
  );
}
