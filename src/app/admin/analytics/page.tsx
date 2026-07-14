import {
  getKpiSummary,
  getRevenueTrend,
  getOrderTrend,
  getUserSignupTrend,
  getRevenueByCategory,
} from "@/data/analytics";
import { getTopSellingGames } from "@/data/orders";
import { StatTile } from "@/components/admin/analytics/StatTile";
import { RevenueTrendChart } from "@/components/admin/analytics/RevenueTrendChart";
import { OrderTrendChart } from "@/components/admin/analytics/OrderTrendChart";
import { UserSignupTrendChart } from "@/components/admin/analytics/UserSignupTrendChart";
import { TopSellersChart } from "@/components/admin/analytics/TopSellersChart";
import { RevenueByCategoryChart } from "@/components/admin/analytics/RevenueByCategoryChart";

export default async function AdminAnalyticsPage() {
  const [kpis, revenueTrend, orderTrend, userTrend, revenueByCategory, topSellers] =
    await Promise.all([
      getKpiSummary(),
      getRevenueTrend(30),
      getOrderTrend(30),
      getUserSignupTrend(30),
      getRevenueByCategory(),
      getTopSellingGames(8),
    ]);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Analytics</h2>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Total revenue" value={`$${kpis.totalRevenue.toFixed(2)}`} />
        <StatTile label="Total orders" value={String(kpis.totalOrders)} />
        <StatTile label="Avg order value" value={`$${kpis.avgOrderValue.toFixed(2)}`} />
        <StatTile label="Total users" value={String(kpis.totalUsers)} />
        <StatTile label="New users (7d)" value={String(kpis.newUsers7d)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueTrendChart data={revenueTrend} />
        <OrderTrendChart data={orderTrend} />
        <UserSignupTrendChart data={userTrend} />
        <RevenueByCategoryChart data={revenueByCategory} />
      </div>

      <div className="mt-4">
        <TopSellersChart
          data={topSellers.map((g) => ({ title: g.title, unitsSold: g.unitsSold }))}
        />
      </div>
    </div>
  );
}
