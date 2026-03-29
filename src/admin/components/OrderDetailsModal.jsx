import StatusBadge from "./StatusBadge";

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

function OrderDetailsModal({ order, open, onClose }) {
  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">Order Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm"
          >
            Close
          </button>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          <Row label="Order ID" value={order._id} />
          <Row label="Customer" value={order.customerName || order.user?.name || "Guest"} />
          <Row label="Email" value={order.email || order.user?.email || "N/A"} />
          <Row label="Total" value={`Rs. ${Number(order.totalPrice || 0).toFixed(2)}`} />
          <Row label="Payment" value={order.paymentMethod || "N/A"} />
          <div className="flex items-start justify-between gap-4 py-2">
            <span className="text-sm text-muted">Status</span>
            <StatusBadge value={order.orderStatus || "created"} />
          </div>
          <Row label="Created" value={new Date(order.createdAt).toLocaleString()} />
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;
