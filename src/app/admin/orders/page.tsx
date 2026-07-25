import { getAllOrders } from "@/data/orders";
import { Pagination } from "@/components/admin/Pagination";
import { getTotalPages, parsePageParam } from "@/lib/pagination";

const PAGE_SIZE = 20;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const { orders, totalCount } = await getAllOrders({ page, pageSize: PAGE_SIZE });
  const totalPages = getTotalPages(totalCount, PAGE_SIZE);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Orders</h2>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Order</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Items</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-0">
                <td className="p-3 font-mono text-xs">{order.id.slice(-8)}</td>
                <td className="p-3">
                  {order.user.name ?? order.user.email ?? "Unknown"}
                </td>
                <td className="p-3">{order.items.length}</td>
                <td className="p-3">${order.total.toFixed(2)}</td>
                <td className="p-3">{order.status}</td>
                <td className="p-3 text-muted-foreground">
                  {order.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/orders" />
    </div>
  );
}
