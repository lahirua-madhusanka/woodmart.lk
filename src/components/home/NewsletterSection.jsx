function NewsletterSection() {
  return (
    <section className="container-pad py-10">
      <div className="rounded-2xl bg-gradient-to-r from-brand-dark to-brand p-8 text-white lg:p-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-light">
              Join Our Newsletter
            </p>
            <h3 className="mt-2 font-display text-3xl font-semibold">
              Get style drops, private offers, and design tips.
            </h3>
            <p className="mt-2 text-sm text-brand-light">
              Be first to access curated product launches and exclusive seasonal edits.
            </p>
          </div>

          <form className="flex w-full flex-col gap-3 sm:flex-row lg:w-[420px]">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-white/30 bg-white/15 px-4 py-3 text-sm text-white placeholder:text-slate-200 outline-none"
            />
            <button className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-dark transition hover:bg-slate-100">
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default NewsletterSection;