function SummaryCard({ title, value, helper, icon: Icon }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
          <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
          {helper ? <p className="mt-1 text-xs text-muted">{helper}</p> : null}
        </div>
        {Icon ? (
          <span className="inline-flex rounded-lg bg-brand-light p-2 text-brand-dark">
            <Icon size={18} />
          </span>
        ) : null}
      </div>
    </article>
  );
}

export default SummaryCard;
