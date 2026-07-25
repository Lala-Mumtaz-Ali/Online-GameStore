"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * A primary navigation item that knows whether it is the current section.
 *
 * usePathname is safe to use without a <Suspense> boundary - unlike
 * useSearchParams, it does not opt the route into client-side rendering.
 */
export function NavLink({
  href,
  children,
  badge,
}: {
  href: string;
  children: React.ReactNode;
  /** Small count rendered alongside the label, e.g. items in the cart. */
  badge?: number;
}) {
  const pathname = usePathname();
  // Exact match for "/", prefix match elsewhere, so /games/elden-ring still
  // highlights Games.
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none font-semibold text-primary-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
