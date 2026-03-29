import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import DataTable from "../../components/admin/DataTable";
import StatsCard from "../../components/admin/StatsCard";
import StatusBadge from "../../components/admin/StatusBadge";
import { getApiErrorMessage } from "../../services/apiClient";
import { getAdminStatsApi } from "../../services/adminApi/dashboardService";

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getAdminStatsApi();
        setStats(data);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const recentOrderRows = useMemo(() => stats?.recentOrders || [], [stats]);
  const lowStockRows = useMemo(() => stats?.lowStockProducts || [], [stats]);

  if (loading) {
    return <div className="rounded-xl bg-white p-10 text-center text-muted">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Products" value={stats?.totals?.products || 0} icon={Package} />
        <StatsCard title="Total Orders" value={stats?.totals?.orders || 0} icon={ShoppingCart} />
        <StatsCard title="Total Users" value={stats?.totals?.users || 0} icon={Users} />
        <StatsCard
          title="Revenue"
          value={`Rs. ${Number(stats?.totals?.revenue || 0).toFixed(2)}`}
          icon={DollarSign}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Recent Orders</h2>
          <DataTable
            rows={recentOrderRows}
            columns={[
              {
                key: "id",
                label: "Order",
                render: (row) => `#${row._id.slice(-8).toUpperCase()}`,
              },
              {
                key: "customer",
                label: "Customer",
                render: (row) => row.userId?.name || "N/A",
              },
              {
                key: "total",
                label: "Total",
                render: (row) => `Rs. ${Number(row.totalAmount || 0).toFixed(2)}`,
              },
              {
                key: "status",
                label: "Status",
                render: (row) => <StatusBadge value={row.orderStatus} />,
              },
            ]}
            emptyText="No recent orders"
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Low Stock Products</h2>
          <DataTable
            rows={lowStockRows}
            columns={[
              { key: "name", label: "Product", render: (row) => row.name },
              { key: "category", label: "Category" },
              {
                key: "stock",
                label: "Stock",
                render: (row) => (
                  <StatusBadge value={row.stock <= 5 ? "low" : "normal"} />
                ),
              },
              {
                key: "qty",
                label: "Qty",
                render: (row) => row.stock,
              },
            ]}
            emptyText="No low stock products"
          />
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
