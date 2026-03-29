function EmptyState({ title = "No data", description = "There is nothing to display yet." }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}

export default EmptyState;
