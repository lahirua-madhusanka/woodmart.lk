import { Headset, RotateCw, ShieldCheck, Truck } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Reliable tracked shipping across all major regions.",
  },
  {
    icon: ShieldCheck,
    title: "Premium Quality",
    description: "Selected materials and strict quality checks on every order.",
  },
  {
    icon: RotateCw,
    title: "Easy Returns",
    description: "Simple 30-day return process with responsive support.",
  },
  {
    icon: Headset,
    title: "Concierge Support",
    description: "Design and product guidance from our in-house team.",
  },
];

function BenefitsSection() {
  return (
    <section className="container-pad py-10">
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-2 lg:grid-cols-4 lg:p-8">
        {benefits.map((benefit) => (
          <article key={benefit.title} className="rounded-xl bg-slate-50 p-4">
            <benefit.icon size={20} className="text-brand" />
            <h3 className="mt-3 text-base font-semibold">{benefit.title}</h3>
            <p className="mt-1 text-sm text-muted">{benefit.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default BenefitsSection;