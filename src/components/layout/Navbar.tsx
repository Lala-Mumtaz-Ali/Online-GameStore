import Link from "next/link";
import { Suspense } from "react";
import { auth, signOut } from "@/auth";
import { GameSearchInput } from "@/components/store/GameSearchInput";
import { NavLink } from "@/components/layout/NavLink";
import { Button } from "@/components/ui/button";
import { getCartCount } from "@/data/cart";
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/data/notificationCenter";
import { NotificationBell } from "@/components/layout/NotificationBell";

/** First letter of the display name, or of the email, for the account chip. */
function initialFor(name: string | null | undefined, email: string | null | undefined) {
  return (name?.trim()?.[0] ?? email?.trim()?.[0] ?? "?").toUpperCase();
}

export async function Navbar() {
  const session = await auth();
  const cartCount = session?.user ? await getCartCount() : 0;
  const [notifications, unreadCount] = session?.user
    ? await Promise.all([getUserNotifications(), getUnreadNotificationCount()])
    : [[], 0];

  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <Link href="/" className="mr-1 shrink-0 text-xl font-bold tracking-tight">
          Game<span className="text-primary">Store</span>
        </Link>

        {/* Browsing destinations. Kept together and visually distinct from the
            account controls on the right, so "Admin" the section is never
            confused with "Admin" the signed-in user. */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/games">Games</NavLink>
          <NavLink href="/categories">Categories</NavLink>
          {user && (
            <>
              <NavLink href="/library">Library</NavLink>
              <NavLink href="/orders">Orders</NavLink>
            </>
          )}
        </div>

        {/* Suspense is required because GameSearchInput reads useSearchParams.
            Hidden below sm: there is no mobile menu yet, so every control
            renders at every width and the bar would overflow. /games provides
            its own search input for small screens. */}
        <Suspense
          fallback={<div className="ml-auto hidden h-9 w-full max-w-xs sm:block" />}
        >
          <GameSearchInput className="ml-auto hidden w-full max-w-xs sm:block" />
        </Suspense>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-2">
          {user ? (
            <>
              <NavLink href="/cart" badge={cartCount}>
                Cart
              </NavLink>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
                >
                  Admin
                </Link>
              )}

              {/* Everything past this divider is about the signed-in account
                  rather than about navigating the store. */}
              <span className="mx-2 h-8 w-px bg-border" aria-hidden="true" />

              <NotificationBell
                initialNotifications={notifications.map((n) => ({
                  id: n.id,
                  title: n.title,
                  body: n.body,
                  link: n.link,
                  read: n.read,
                  createdAt: n.createdAt.toISOString(),
                }))}
                initialUnreadCount={unreadCount}
              />

              <Link
                href="/account"
                className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-muted"
                title="Your account"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initialFor(user.name, user.email)}
                </span>
                <span className="hidden max-w-[10rem] truncate text-sm font-medium lg:block">
                  {user.name ?? user.email ?? "Account"}
                </span>
              </Link>

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/login">Sign in</Link>}
              />
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/register">Create account</Link>}
              />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
