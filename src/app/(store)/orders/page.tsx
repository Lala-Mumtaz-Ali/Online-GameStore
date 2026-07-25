import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserOrders } from "@/data/orders";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/orders");
  }

  const orders = await getUserOrders();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Your Orders</h1>

      {orders.length === 0 ? (
        <p className="text-muted-foreground">
          You haven&apos;t placed any orders yet.{" "}
          <Link href="/games" className="underline">
            Browse games
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between rounded-xl border p-4 hover:border-primary/50"
            >
              <div>
                <p className="font-medium">Order #{order.id.slice(-8)}</p>
                <p className="text-sm text-muted-foreground">
                  {order.createdAt.toLocaleDateString()} · {order.items.length} item
                  {order.items.length === 1 ? "" : "s"} · {order.status}
                </p>
              </div>
              <p className="font-semibold">${order.total.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
