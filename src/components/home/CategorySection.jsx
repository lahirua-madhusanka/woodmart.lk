import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

function CategorySection({ categories }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = container.querySelector("a")?.offsetWidth ?? 160;
    container.scrollBy({ left: direction === "left" ? -(cardWidth + 12) : (cardWidth + 12), behavior: "smooth" });
  };

  return (
    <section className="container-pad py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Featured Categories
          </p>
          <h2 className="font-display text-3xl font-bold text-ink">Shop by lifestyle</h2>
        </div>
        <Link to="/shop" className="hidden items-center gap-1 text-sm font-semibold text-brand md:inline-flex">
          Explore All <ArrowRight size={15} />
        </Link>
      </div>

      {/* Mobile: horizontal scroll with arrow buttons */}
      <div className="relative sm:hidden">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-slate-200 text-ink transition hover:bg-brand hover:text-white hover:border-brand"
        >
          <ChevronLeft size={18} />
        </button>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide scroll-smooth">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/shop?category=${encodeURIComponent(category.name)}`}
              className="shrink-0 w-[47%]"
              aria-label={`View ${category.name} products`}
            >
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="overflow-hidden w-full h-36">
                  {category.image ? (
                    <img src={category.image} alt={category.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-slate-100" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold">{category.name}</h3>
                  <p className="text-xs text-muted">
                    {category.count || 0} {(category.count || 0) === 1 ? "product" : "products"}
                  </p>
                </div>
              </motion.article>
            </Link>
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-slate-200 text-ink transition hover:bg-brand hover:text-white hover:border-brand"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Tablet + Desktop: grid */}
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            to={`/shop?category=${encodeURIComponent(category.name)}`}
            className="block"
            aria-label={`View ${category.name} products`}
          >
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="overflow-hidden w-full h-44">
                {category.image ? (
                  <img src={category.image} alt={category.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full bg-slate-100" />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">{category.name}</h3>
                <p className="text-sm text-muted">
                  {category.count || 0} {(category.count || 0) === 1 ? "product" : "products"}
                </p>
              </div>
            </motion.article>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default CategorySection;