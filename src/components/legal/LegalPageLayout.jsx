import { useEffect } from "react";
import { CheckCircle2, FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const highlightIcons = [ShieldCheck, LockKeyhole, FileText];

function LegalPageLayout({ eyebrow, title, description, seoTitle, seoDescription, highlights, sections }) {
  useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription?.getAttribute("content");

    document.title = seoTitle;
    if (metaDescription) {
      metaDescription.setAttribute("content", seoDescription);
    }

    return () => {
      document.title = previousTitle;
      if (metaDescription && previousDescription) {
        metaDescription.setAttribute("content", previousDescription);
      }
    };
  }, [seoDescription, seoTitle]);

  return (
    <section className="container-pad py-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mb-12"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">{eyebrow}</p>
        <h1 className="font-display text-4xl font-bold text-ink md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted md:text-base">{description}</p>
      </motion.div>

      <div className="mb-12 grid gap-6 md:grid-cols-3">
        {highlights.map((item, index) => {
          const Icon = highlightIcons[index % highlightIcons.length];
          return (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45 }}
              className="rounded-lg border border-slate-200 bg-white p-6"
            >
              <Icon size={28} className="mb-5 text-brand" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Policy Note</p>
              <p className="mt-3 text-sm leading-6 text-muted">{item}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="space-y-8">
        {sections.map((section, index) => (
          <motion.article
            key={section.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: Math.min(index * 0.025, 0.14) }}
            className="rounded-lg border border-slate-200 bg-slate-50 p-6 md:p-8"
          >
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">{section.title}</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 md:text-base">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {section.points ? (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {section.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-brand" size={17} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </motion.article>
        ))}
      </div>
    </section>
  );
}

export default LegalPageLayout;
