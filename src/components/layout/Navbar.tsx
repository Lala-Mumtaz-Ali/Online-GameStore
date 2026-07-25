import Link from "next/link";
import { Suspense } from "react";
import { auth, signOut } from "@/auth";
import { GameSearchInput } from "@/components/store/GameSearchInput";
import { Button } from "@/components/ui/button";
import { getCartCount } from "@/data/cart";
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/data/notificationCenter";
import { NotificationBell } from "@/components/layout/NotificationBell";

export async function Navbar() {
  const session = await auth();
  const cartCount = session?.user ? await getCartCount() : 0;
  const [notifications, unreadCount] = session?.user
    ? await Promise.all([getUserNotifications(), getUnreadNotificationCount()])
    : [[], 0];

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="font-bold text-xl mr-6">
          GameStore
        </Link>
        {/* Hidden below sm: there is no mobile menu yet, so every nav link
            renders at every width and an always-visible search box would
            overflow the bar. /games renders its own search input for small screens.
            Suspense is required because GameSearchInput reads useSearchParams. */}
        <Suspense fallback={<div className="mr-4 hidden h-9 w-full max-w-xs sm:block" />}>
          <GameSearchInput className="mr-4 hidden w-full max-w-xs sm:block" />
        </Suspense>
        <div className="ml-auto flex items-center space-x-4">
          <Link href="/games" className="text-sm font-medium hover:underline">
            Games
          </Link>
          <Link href="/categories" className="text-sm font-medium hover:underline">
            Categories
          </Link>
          {session?.user ? (
            <>
              <Link href="/library" className="text-sm font-medium hover:underline">
                Library
              </Link>
              <Link href="/orders" className="text-sm font-medium hover:underline">
                Orders
              </Link>
              <Link href="/cart" className="text-sm font-medium hover:underline">
                Cart{cartCount > 0 ? ` (${cartCount})` : ""}
              </Link>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="text-sm font-medium hover:underline">
                  Admin
                </Link>
              )}
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
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium hover:underline">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
