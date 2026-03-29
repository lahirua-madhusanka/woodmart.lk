const brandNames = ["North Atelier", "Woodline Studio", "Mori Casa", "Lumen Co.", "Cedar House", "Oak & Loom"];

function BrandLogosSection() {
  return (
    <section className="container-pad py-8">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-muted">
          Trusted by premium design partners
        </p>
        <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-3 lg:grid-cols-6">
          {brandNames.map((name) => (
            <div key={name} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BrandLogosSection;
