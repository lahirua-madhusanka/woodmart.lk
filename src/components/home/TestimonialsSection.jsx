import { testimonials } from "../../data/products";

function TestimonialsSection() {
  return (
    <section className="container-pad py-10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">Testimonials</p>
        <h2 className="font-display text-3xl font-bold text-ink">What customers are saying</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm leading-relaxed text-muted">"{item.quote}"</p>
            <p className="mt-4 text-sm font-semibold text-ink">{item.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TestimonialsSection;
