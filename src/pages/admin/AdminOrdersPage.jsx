import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import StatusBadge from "../../components/admin/StatusBadge";
import { getApiErrorMessage } from "../../services/apiClient";
import {
  getAdminOrdersApi,
  updateAdminOrderStatusApi,
} from "../../services/adminApi/ordersService";

const DataTable = lazy(() => import("../../components/admin/DataTable"));
const OrderDetailsModal = lazy(() => import("../../components/admin/OrderDetailsModal"));

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getAdminOrdersApi({ paymentStatus, orderStatus, q: query });
      setOrders(data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [paymentStatus, orderStatus]);

  const filtered = useMemo(() => {
    const lowered = query.toLowerCase().trim();
    if (!lowered) return orders;

    return orders.filter(
      (order) =>
        order._id.toLowerCase().includes(lowered) ||
        order.userId?.name?.toLowerCase().includes(lowered) ||
        order.userId?.email?.toLowerCase().includes(lowered)
    );
  }, [orders, query]);

  const updateStatus = async (id, payload) => {
    try {
      const updated = await updateAdminOrderStatusApi(id, payload);
      setOrders((prev) => prev.map((order) => (order._id === id ? updated : order)));
      toast.success("Order updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by order/customer"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <select
          value={paymentStatus}
          onChange={(event) => setPaymentStatus(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All payment statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={orderStatus}
          onChange={(event) => setOrderStatus(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All order statuses</option>
          <option value="created">Created</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={loadOrders} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center text-muted">Loading orders...</div>
      ) : (
        <Suspense fallback={<div className="rounded-xl bg-white p-10 text-center text-muted">Loading table...</div>}>
          <DataTable
            rows={filtered}
            columns={[
            {
              key: "id",
              label: "Order ID",
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
              key: "payment",
              label: "Payment",
              render: (row) => <StatusBadge value={row.paymentStatus} />,
            },
            {
              key: "orderStatus",
              label: "Order Status",
              render: (row) => <StatusBadge value={row.orderStatus} />,
            },
            {
              key: "date",
              label: "Date",
              render: (row) => new Date(row.createdAt).toLocaleDateString(),
            },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedOrder(row)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold"
                  >
                    View
                  </button>
                  <select
                    value={row.orderStatus}
                    onChange={(event) => updateStatus(row._id, { orderStatus: event.target.value })}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value="created">Created</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              ),
            },
            ]}
            emptyText="No orders found"
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <OrderDetailsModal open={Boolean(selectedOrder)} order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      </Suspense>
    </div>
  );
}

export default AdminOrdersPage;
