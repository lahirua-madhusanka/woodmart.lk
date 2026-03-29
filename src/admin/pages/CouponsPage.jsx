import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
} from "../services/couponsService";

function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getCoupons();
      setCoupons(data || []);
      setLoading(false);
    };

    load();
  }, []);

  const addCoupon = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = await createCoupon({
      code: form.get("code")?.toString().trim().toUpperCase() || "",
      discountType: form.get("discountType")?.toString() || "percentage",
      discountValue: Number(form.get("discountValue") || 0),
      minPurchase: Number(form.get("minPurchase") || 0),
      expiryDate: form.get("expiryDate")?.toString() || "",
      active: true,
    });
    setCoupons((prev) => [next, ...prev]);
    event.currentTarget.reset();
  };

  const toggleStatus = async (coupon) => {
    const updated = await updateCoupon(coupon.id, { active: !coupon.active });
    setCoupons((prev) => prev.map((item) => (item.id === coupon.id ? updated : item)));
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteCoupon(deleteId);
    setCoupons((prev) => prev.filter((item) => item.id !== deleteId));
    setDeleteId("");
    setDeleting(false);
  };

  if (loading) {
    return <Loader label="Loading coupons..." />;
  }

  return (
    <div className="space-y-5">
      <form onSubmit={addCoupon} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-6">
        <input name="code" required placeholder="Code" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select name="discountType" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>
        <input name="discountValue" type="number" min="0" required placeholder="Discount" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="minPurchase" type="number" min="0" required placeholder="Min purchase" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="expiryDate" type="date" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex items-center justify-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white">
          <Plus size={14} />
          Add Coupon
        </button>
      </form>

      <DataTable
        rowKey="id"
        rows={coupons}
        columns={[
          { key: "code", title: "Code" },
          {
            key: "discount",
            title: "Discount",
            render: (row) =>
              row.discountType === "percentage"
                ? `${row.discountValue}%`
                : `Rs. ${Number(row.discountValue || 0).toFixed(2)}`,
          },
          {
            key: "minPurchase",
            title: "Min Purchase",
            render: (row) => `Rs. ${Number(row.minPurchase || 0).toFixed(2)}`,
          },
          {
            key: "expiryDate",
            title: "Expiry",
            render: (row) => new Date(row.expiryDate).toLocaleDateString(),
          },
          {
            key: "active",
            title: "Status",
            render: (row) => <StatusBadge value={row.active ? "active" : "inactive"} />,
          },
          {
            key: "actions",
            title: "Actions",
            render: (row) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleStatus(row)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                >
                  {row.active ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(row.id)}
                  className="rounded-md border border-red-200 p-2 text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ),
          },
        ]}
        emptyFallback={<EmptyState title="No coupons available" />}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteId)}
        title="Delete Coupon"
        message="The selected coupon will be permanently removed."
        onConfirm={handleDelete}
        onClose={() => setDeleteId("")}
        loading={deleting}
      />
    </div>
  );
}

export default CouponsPage;
