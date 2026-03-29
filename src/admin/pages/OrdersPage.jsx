import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import FilterDropdown from "../components/FilterDropdown";
import Loader from "../components/Loader";
import OrderDetailsModal from "../components/OrderDetailsModal";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import { getOrders, updateOrderStatus } from "../services/ordersService";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [orderStatus, setOrderStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    const data = await getOrders({
      paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
      orderStatus: orderStatus === "all" ? undefined : orderStatus,
    });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [paymentStatus, orderStatus]);

  const filtered = useMemo(() => {
    const lowered = query.toLowerCase().trim();
    if (!lowered) return orders;

    return orders.filter((item) => {
      const idMatch = item._id?.toLowerCase().includes(lowered);
      const nameMatch = (item.user?.name || item.userId?.name || item.customerName || "")
        .toLowerCase()
        .includes(lowered);
      const emailMatch = (item.user?.email || item.userId?.email || item.email || "")
        .toLowerCase()
        .includes(lowered);
      return idMatch || nameMatch || emailMatch;
    });
  }, [orders, query]);

  const handleStatusChange = async (id, value) => {
    const updated = await updateOrderStatus(id, { orderStatus: value });
    setOrders((prev) => prev.map((order) => (order._id === id ? updated : order)));
  };

  if (loading) {
    return <Loader label="Loading orders..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by order or customer" />
        <FilterDropdown
          value={paymentStatus}
          onChange={setPaymentStatus}
          label="Payment"
          options={[
            { value: "all", label: "All payments" },
            { value: "pending", label: "Pending" },
            { value: "paid", label: "Paid" },
            { value: "failed", label: "Failed" },
          ]}
        />
        <FilterDropdown
          value={orderStatus}
          onChange={setOrderStatus}
          label="Order"
          options={[
            { value: "all", label: "All statuses" },
            { value: "created", label: "Created" },
            { value: "processing", label: "Processing" },
            { value: "shipped", label: "Shipped" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
      </div>

      <DataTable
        rowKey="_id"
        rows={filtered}
        columns={[
          {
            key: "id",
            title: "Order",
            render: (row) => `#${String(row._id || "").slice(-8).toUpperCase()}`,
          },
          {
            key: "customer",
            title: "Customer",
            render: (row) => row.user?.name || row.userId?.name || row.customerName || "Guest",
          },
          {
            key: "total",
            title: "Total",
            render: (row) => `Rs. ${Number(row.totalPrice || row.totalAmount || 0).toFixed(2)}`,
          },
          {
            key: "payment",
            title: "Payment",
            render: (row) => <StatusBadge value={row.paymentStatus || "pending"} />,
          },
          {
            key: "status",
            title: "Status",
            render: (row) => <StatusBadge value={row.orderStatus || "created"} />,
          },
          {
            key: "actions",
            title: "Actions",
            render: (row) => (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(row)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold"
                >
                  View
                </button>
                <select
                  value={row.orderStatus || "created"}
                  onChange={(event) => handleStatusChange(row._id, event.target.value)}
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
        emptyFallback={<EmptyState title="No orders found" />}
      />

      <OrderDetailsModal
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}

export default OrdersPage;
