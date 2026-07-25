import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserOrderById } from "@/data/orders";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const order = await getUserOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-3xl font-bold">Order Confirmed</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Order #{order.id.slice(-8)} · placed {order.createdAt.toLocaleDateString()} ·
        status: {order.status}
      </p>

      <div className="rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">Items</h2>
        <div className="flex flex-col gap-2 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.title} × {item.quantity}
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/orders" className="text-sm underline">
          View all orders
        </Link>
        <Link href="/games" className="text-sm underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
