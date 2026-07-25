import "server-only";
import prisma from "@/db";
import { requireAdmin } from "@/data/admin";
import { buildDailySeries } from "@/lib/dateSeries";

export async function getKpiSummary() {
  await requireAdmin();

  const weekAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

  const [revenueAgg, orderCount, totalUsers, newUsers] = await Promise.all([
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  const totalRevenue = revenueAgg._sum.total ?? 0;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  return { totalRevenue, totalOrders: orderCount, avgOrderValue, totalUsers, newUsers7d: newUsers };
}

export async function getRevenueTrend(days = 30) {
  await requireAdmin();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  since.setUTCHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { status: "PAID", createdAt: { gte: since } },
    select: { createdAt: true, total: true },
  });

  return buildDailySeries<{ revenue: number }>(
    days,
    orders,
    (acc, key, row) => {
      const current = acc.get(key)!;
      acc.set(key, { revenue: current.revenue + (row as typeof orders[number]).total });
    },
    { revenue: 0 }
  );
}

export async function getOrderTrend(days = 30) {
  await requireAdmin();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  since.setUTCHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { status: "PAID", createdAt: { gte: since } },
    select: { createdAt: true },
  });

  return buildDailySeries<{ orders: number }>(
    days,
    orders,
    (acc, key) => {
      const current = acc.get(key)!;
      acc.set(key, { orders: current.orders + 1 });
    },
    { orders: 0 }
  );
}

export async function getUserSignupTrend(days = 30) {
  await requireAdmin();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  since.setUTCHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  return buildDailySeries<{ signups: number }>(
    days,
    users,
    (acc, key) => {
      const current = acc.get(key)!;
      acc.set(key, { signups: current.signups + 1 });
    },
    { signups: 0 }
  );
}

export async function getRevenueByCategory() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      games: {
        include: {
          orderItems: {
            where: { order: { status: "PAID" } },
          },
        },
      },
    },
  });

  const withRevenue = categories.map((category, colorIndex) => ({
    name: category.name,
    colorIndex,
    revenue: category.games.reduce(
      (sum, game) =>
        sum + game.orderItems.reduce((s, item) => s + item.price * item.quantity, 0),
      0
    ),
  }));

  return withRevenue.sort((a, b) => b.revenue - a.revenue);
}
