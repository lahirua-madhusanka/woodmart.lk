function SectionSkeleton({ minHeight = 320, title = "Loading section..." }) {
  return (
    <div className="container-pad py-10" style={{ minHeight }} aria-hidden>
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
        <div className="h-4 w-36 rounded bg-slate-200" />
        <div className="mt-4 h-8 w-64 rounded bg-slate-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-44 rounded-xl bg-slate-200" />
          <div className="h-44 rounded-xl bg-slate-200" />
          <div className="h-44 rounded-xl bg-slate-200" />
        </div>
        <p className="mt-4 text-xs text-muted">{title}</p>
      </div>
    </div>
  );
}

export default SectionSkeleton;
