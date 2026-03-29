function Loader({ label = "Loading..." }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      <p className="mt-3 text-sm text-muted">{label}</p>
    </div>
  );
}

export default Loader;
