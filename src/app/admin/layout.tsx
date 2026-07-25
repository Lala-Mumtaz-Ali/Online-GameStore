import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { ToastProvider, Toaster } from "@/components/ui/toast";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    // The admin area had no ToastProvider, so admin server actions had no way to
    // report success or failure. Mirrors (store)/layout.tsx.
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center gap-6 border-b px-6 py-4">
          <h1 className="text-lg font-semibold">Admin</h1>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/admin/games" className="hover:underline">
              Games
            </Link>
            <Link href="/admin/categories" className="hover:underline">
              Categories
            </Link>
            <Link href="/admin/orders" className="hover:underline">
              Orders
            </Link>
            <Link href="/admin/users" className="hover:underline">
              Users
            </Link>
            <Link href="/admin/analytics" className="hover:underline">
              Analytics
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/" className="text-sm hover:underline">
              Back to Store
            </Link>
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
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Toaster />
    </ToastProvider>
  );
}
