import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Droplets, Hammer, RefreshCw, ShieldCheck, Sparkles, Wind } from "lucide-react";
import { motion } from "framer-motion";

const heroImage =
  "https://ik.imagekit.io/awh2hzli9/woodmart/banners/hero-1780636169475-93d79da2-a0db-4cd5-acb5-43d5d9b3b180_o9mcRgJzb.png?updatedAt=1780636171976";

const guideSections = [
  {
    title: "Before First Use",
    icon: ShieldCheck,
    image:
      "https://ik.imagekit.io/awh2hzli9/woodmart/how%20to%20care/how%20to%20care%20woodmart%20(1).png",
    body:
      "Before using your Nadun wood cutting board for the first time, wipe it with a clean damp cloth and allow it to dry fully. Apply a thin, even layer of food-grade mineral oil or board oil to help protect the wood surface before daily use.",
    tips: [
      "Wipe gently with a damp cloth.",
      "Let the board dry completely.",
      "Apply food-grade mineral oil before heavy use.",
    ],
  },
  {
    title: "Daily Cleaning",
    icon: Droplets,
    image:
      "https://ik.imagekit.io/awh2hzli9/woodmart/how%20to%20care/how%20to%20care%20woodmart%20(2).png",
    body:
      "After each use, wash the board by hand with mild dish soap and warm water. Rinse quickly, wipe away excess moisture, and stand the board upright so both sides can air dry evenly.",
    tips: [
      "Hand wash only with mild soap.",
      "Dry with a clean towel immediately.",
      "Store upright in a ventilated place.",
    ],
  },
  {
    title: "Important Care Tips",
    icon: Sparkles,
    image:
      "https://ik.imagekit.io/awh2hzli9/woodmart/how%20to%20care/how%20to%20care%20woodmart%20(4).png",
    body:
      "Wood is a natural material, so a little care keeps it stable, hygienic, and beautiful. Avoid long exposure to water, strong sunlight, and extreme heat.",
    tips: [
      "Use both sides of the board to balance wear.",
      "Clean soon after cutting wet or strongly colored foods.",
      "Keep the board away from direct heat and harsh sunlight.",
    ],
  },
  {
    title: "Oiling & Maintenance",
    icon: RefreshCw,
    image:
      "https://ik.imagekit.io/awh2hzli9/woodmart/how%20to%20care/how%20to%20care%20woodmart%20(5).png",
    body:
      "Oil your board every few weeks, or whenever the surface looks dry. Apply a small amount of food-grade mineral oil, spread it evenly, let it absorb, then wipe away any excess.",
    tips: [
      "Oil more often during dry weather.",
      "Use only food-safe board oil or mineral oil.",
      "Avoid vegetable oils because they can turn rancid.",
    ],
  },
  {
    title: "Knife Marks & Natural Aging",
    icon: Hammer,
    image:
      "https://ik.imagekit.io/awh2hzli9/woodmart/how%20to%20care/how%20to%20care%20woodmart%20(2).jpg",
    body:
      "Small knife marks are normal and part of the character of a handcrafted wooden board. Over time, Nadun wood develops a richer tone and a natural patina with regular use and proper care.",
    tips: [
      "Light knife marks are expected with daily use.",
      "Regular oiling reduces dryness and surface roughness.",
      "A well-used board can be refreshed when needed.",
    ],
  },
  {
    title: "Restoration Service",
    icon: ShieldCheck,
    image:
      "https://ik.imagekit.io/awh2hzli9/woodmart/how%20to%20care/how%20to%20care%20woodmart%20(1).jpg",
    body:
      "If your board becomes deeply scratched, dry, or uneven after long-term use, contact Woodmart.lk for restoration guidance. We can advise on sanding, oiling, and refreshing the surface safely.",
    tips: [
      "Reach out before attempting deep sanding.",
      "Restoration can extend the life of your board.",
      "Proper maintenance keeps the board beautiful for years.",
    ],
  },
];

const doNotItems = [
  "Do not put your board in the dishwasher.",
  "Do not soak it in water.",
  "Do not use bleach or harsh chemical cleaners.",
  "Do not place it near direct flames, heaters, or strong sunlight.",
  "Do not leave wet food or liquid sitting on the board for long periods.",
];

function BoardCareGuidePage() {
  useEffect(() => {
    const previousTitle = document.title;
    const description =
      "Learn how to properly clean, oil, maintain, and extend the life of your Nadun wood cutting board with Woodmart.lk's complete board care guide.";
    const metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription?.getAttribute("content");

    document.title = "Nadun Wood Cutting Board Care Guide | Woodmart.lk Sri Lanka";
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    return () => {
      document.title = previousTitle;
      if (metaDescription && previousDescription) {
        metaDescription.setAttribute("content", previousDescription);
      }
    };
  }, []);

  return (
    <div className="bg-slate-50">
      <section className="relative min-h-[520px] overflow-hidden text-white">
        <img
          src={heroImage}
          alt="Premium wooden cutting board"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
        <div className="container-pad relative z-10 flex min-h-[520px] items-center">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-brand-light">
              Woodmart.lk Care Guide
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
              How to Care for Your Nadun Wood Cutting Board
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/90 md:text-xl">
              Simple care instructions to keep your handcrafted Nadun wood cutting board beautiful,
              hygienic, and long-lasting.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container-pad py-12 md:py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            "Handcrafted Nadun wood needs gentle daily care.",
            "Food-safe oiling protects the grain and finish.",
            "Correct drying prevents warping and surface damage.",
          ].map((item) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45 }}
              className="rounded-2xl border border-brand/10 bg-white p-5 shadow-glow"
            >
              <CheckCircle2 className="mb-3 text-brand" size={24} />
              <p className="text-sm font-semibold leading-6 text-ink">{item}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container-pad pb-14">
        <div className="grid gap-7">
          {guideSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.article
                key={section.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.2) }}
                className="grid overflow-hidden rounded-2xl border border-brand/10 bg-white shadow-premium md:grid-cols-[0.95fr_1.35fr]"
              >
                <div className="relative min-h-[240px] overflow-hidden">
                  <img
                    src={section.image}
                    alt={section.title}
                    className="h-full w-full object-cover transition duration-700 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                </div>
                <div className="p-6 md:p-8">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
                    <Icon size={22} />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">{section.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted md:text-base">{section.body}</p>
                  <ul className="mt-5 grid gap-3">
                    {section.tips.map((tip) => (
                      <li key={tip} className="flex gap-3 text-sm leading-6 text-slate-700">
                        <CheckCircle2 className="mt-0.5 shrink-0 text-brand" size={18} />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="container-pad pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-brand/10 bg-white p-6 shadow-premium md:p-8"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Do Not</p>
              <h2 className="font-display text-2xl font-bold text-ink">Avoid These Common Mistakes</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {doNotItems.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl bg-red-50/70 p-4 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 shrink-0" size={17} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}

export default BoardCareGuidePage;
