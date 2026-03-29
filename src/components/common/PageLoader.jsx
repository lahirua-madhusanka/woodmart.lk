function PageLoader({ label = "Loading page..." }) {
  return (
    <div className="container-pad py-16">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
    </div>
  );
}

export default PageLoader;
