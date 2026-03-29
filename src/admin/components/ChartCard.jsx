function ChartCard({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default ChartCard;
