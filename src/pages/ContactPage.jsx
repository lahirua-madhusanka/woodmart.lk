import { Mail, MapPin, Phone } from "lucide-react";

function ContactPage() {
  return (
    <section className="container-pad py-10">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">Contact</p>
        <h1 className="font-display text-4xl font-bold">We are here to help</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
          Reach out for product guidance, order support, or partnership inquiries.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-semibold">First Name</span>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold">Last Name</span>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none" />
            </label>
          </div>

          <label className="text-sm">
            <span className="mb-1 block font-semibold">Email</span>
            <input type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none" />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-semibold">Subject</span>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none" />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-semibold">Message</span>
            <textarea rows="6" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none" />
          </label>

          <button type="button" className="btn-primary">Send Message</button>
        </form>

        <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Store Information</h2>
          <p className="text-sm text-muted">
            Visit our showroom or contact our team for personalized recommendations.
          </p>
          <div className="space-y-3 text-sm text-muted">
            <p className="inline-flex items-start gap-2"><MapPin size={16} className="mt-0.5 text-brand" />224 Artisan Street, New York</p>
            <p className="inline-flex items-center gap-2"><Phone size={16} className="text-brand" />+1 (212) 555-0193</p>
            <p className="inline-flex items-center gap-2"><Mail size={16} className="text-brand" />support@woodmart.lk</p>
          </div>
          <div className="overflow-hidden rounded-xl">
            <img
              src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1000&q=80"
              alt="Store studio"
              className="h-56 w-full object-cover"
            />
          </div>
        </aside>
      </div>
    </section>
  );
}

export default ContactPage;