import { Link } from "react-router-dom";

function PromoBanner() {
  return (
    <section className="container-pad py-8 sm:py-10">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <article className="relative isolate overflow-hidden rounded-2xl bg-slate-900 text-white">
          <img
            src="https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80"
            alt="Dining collection"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/35" />
          <div className="relative z-10 flex min-h-[250px] items-end p-4 sm:min-h-[290px] sm:p-6">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 sm:text-xs">
              Spring Dining Edit
            </p>
              <h3 className="font-display text-[clamp(1.35rem,3.1vw,2rem)] font-semibold leading-tight">
                Save 25% on dining essentials
              </h3>
              <Link
                to="/shop"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/70 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:w-auto"
              >
              Shop Offer
              </Link>
            </div>
          </div>
        </article>

        <article className="relative isolate overflow-hidden rounded-2xl bg-brand-light">
          <img
            src="https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80"
            alt="Workspace products"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/78 to-white/38" />
          <div className="relative z-10 flex min-h-[250px] items-end p-4 sm:min-h-[290px] sm:p-6">
            <div className="max-w-md space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark sm:text-xs">
              Workspace Upgrade
            </p>
              <h3 className="font-display text-[clamp(1.35rem,3.1vw,2rem)] font-semibold leading-tight text-brand-dark">
              Build your calm productive corner
            </h3>
            <Link
              to="/custom-project"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:w-auto"
            >
              Build your dream
            </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default PromoBanner;