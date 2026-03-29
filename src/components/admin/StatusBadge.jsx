const styles = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  delivered: "bg-green-100 text-green-700",
  shipped: "bg-cyan-100 text-cyan-700",
  processing: "bg-indigo-100 text-indigo-700",
  created: "bg-slate-100 text-slate-700",
  cancelled: "bg-rose-100 text-rose-700",
  admin: "bg-brand-light text-brand-dark",
  user: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  low: "bg-red-100 text-red-700",
  normal: "bg-emerald-100 text-emerald-700",
};

function StatusBadge({ value }) {
  const normalized = String(value || "").toLowerCase();
  const style = styles[normalized] || "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {value}
    </span>
  );
}

export default StatusBadge;
