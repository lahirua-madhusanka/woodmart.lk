import { motion } from "framer-motion";
import { ArrowRight, BadgePercent } from "lucide-react";
import RoutePrefetchLink from "../common/RoutePrefetchLink";

function HeroSection() {
  return (
    <section className="container-pad py-8 md:py-12">
      <div className="grid gap-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-dark via-brand to-[#0b74cd] p-6 text-white shadow-glow md:grid-cols-[1.1fr_1fr] md:p-10 lg:p-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="space-y-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <BadgePercent size={14} /> New Season Offer up to 35% Off
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Craft your space with timeless pieces.
          </h1>
          <p className="max-w-xl text-sm text-brand-light md:text-base">
            Discover premium furniture, decor, and lifestyle objects inspired by
            natural materials and modern living.
          </p>
          <div className="flex flex-wrap gap-3">
            <RoutePrefetchLink routeKey="shop" to="/shop" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-dark transition hover:bg-slate-100">
              Shop Now <ArrowRight size={16} />
            </RoutePrefetchLink>
            <RoutePrefetchLink routeKey="shop" to="/shop" className="inline-flex items-center rounded-lg border border-white/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              View Collection
            </RoutePrefetchLink>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          <img
            src="https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80"
            alt="Premium living room setup"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full min-h-72 w-full rounded-xl object-cover"
          />
          <div className="absolute -bottom-4 -left-4 rounded-xl bg-white p-4 text-ink shadow-premium">
            <p className="text-xs font-semibold uppercase text-brand">Featured</p>
            <p className="font-semibold">Nordic Oak Collection</p>
            <p className="text-sm text-muted">Starting from Rs. 149</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;