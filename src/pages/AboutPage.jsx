function AboutPage() {
  return (
    <section className="container-pad py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <img
          src="https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80"
          alt="Woodmart.lk craftsmanship"
          className="h-full min-h-80 w-full rounded-2xl object-cover"
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">About Woodmart.lk</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Designed for elevated everyday living.</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Woodmart.lk was founded to blend artisan craftsmanship with clean contemporary design.
            We source premium materials and partner with trusted workshops to create furniture and
            home essentials that feel timeless, warm, and practical.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-brand">12k+</p>
              <p className="text-xs text-muted">Happy Customers</p>
            </div>
            <div className="rounded-lg bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-brand">120+</p>
              <p className="text-xs text-muted">Curated Products</p>
            </div>
            <div className="rounded-lg bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-brand">4.8/5</p>
              <p className="text-xs text-muted">Average Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutPage;