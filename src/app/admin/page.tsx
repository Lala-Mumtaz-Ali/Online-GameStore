import Link from "next/link";
import { getCatalogStats } from "@/data/games";
import { getOrderStats } from "@/data/orders";

export default async function AdminDashboardPage() {
  const [{ gameCount, categoryCount }, { orderCount, revenue }] = await Promise.all([
    getCatalogStats(),
    getOrderStats(),
  ]);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/games" className="rounded-xl border p-6 hover:bg-muted">
          <p className="text-sm text-muted-foreground">Games</p>
          <p className="text-3xl font-bold">{gameCount}</p>
        </Link>
        <Link href="/admin/categories" className="rounded-xl border p-6 hover:bg-muted">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="text-3xl font-bold">{categoryCount}</p>
        </Link>
        <Link href="/admin/orders" className="rounded-xl border p-6 hover:bg-muted">
          <p className="text-sm text-muted-foreground">Orders</p>
          <p className="text-3xl font-bold">{orderCount}</p>
        </Link>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="text-3xl font-bold">${revenue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
