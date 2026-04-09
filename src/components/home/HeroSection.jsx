import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgePercent, ChevronLeft, ChevronRight } from "lucide-react";
import RoutePrefetchLink from "../common/RoutePrefetchLink";
import { useStorefrontSettings } from "../../context/StorefrontSettingsContext";

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80";

const AUTOPLAY_MS = 5000;

const normalizeSlides = (settings) => {
  const source = Array.isArray(settings?.heroSlides) ? settings.heroSlides : [];
  const slides = source
    .filter(Boolean)
    .filter((slide) => String(slide?.status || "active").toLowerCase() !== "inactive")
    .slice(0, 3)
    .map((slide, index) => ({
      id: String(slide?.id || `hero-slide-${index + 1}`),
      imageUrl: String(slide?.imageUrl || "").trim() || DEFAULT_HERO_IMAGE,
      title: String(slide?.title || settings?.heroTitle || "Craft your space with timeless pieces."),
      subtitle: String(slide?.subtitle || settings?.heroSubtitle || "").trim(),
      buttonText: String(slide?.buttonText || "Shop Now").trim() || "Shop Now",
      buttonLink: String(slide?.buttonLink || "/shop").trim() || "/shop",
      displayOrder: Number.isFinite(Number(slide?.displayOrder)) ? Number(slide.displayOrder) : index + 1,
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (slides.length) return slides;

  return [
    {
      id: "hero-fallback-1",
      imageUrl: settings?.heroImage || DEFAULT_HERO_IMAGE,
      title: settings?.heroTitle || "Craft your space with timeless pieces.",
      subtitle:
        settings?.heroSubtitle ||
        "Discover premium furniture, decor, and lifestyle objects inspired by natural materials and modern living.",
      buttonText: settings?.heroPrimaryButtonText || "Shop Now",
      buttonLink: settings?.heroPrimaryButtonLink || "/shop",
      displayOrder: 1,
    },
  ];
};

function HeroSection() {
  const { settings } = useStorefrontSettings();
  const slides = useMemo(() => normalizeSlides(settings), [settings]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartXRef = useRef(0);

  useEffect(() => {
    setActiveIndex((previous) => {
      if (slides.length <= 1) return 0;
      return previous >= slides.length ? 0 : previous;
    });
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % slides.length);
    }, AUTOPLAY_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [paused, slides.length]);

  const goPrev = () => {
    setActiveIndex((previous) => (previous - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setActiveIndex((previous) => (previous + 1) % slides.length);
  };

  const activeSlide = slides[activeIndex] || slides[0];

  const onTouchStart = (event) => {
    touchStartXRef.current = event.changedTouches?.[0]?.clientX || 0;
  };

  const onTouchEnd = (event) => {
    const touchEndX = event.changedTouches?.[0]?.clientX || 0;
    const deltaX = touchEndX - touchStartXRef.current;
    if (Math.abs(deltaX) < 40 || slides.length <= 1) return;
    if (deltaX < 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  const floatingControlMotion = {
    y: [0, -1.5, 0],
    transition: {
      duration: 4.2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  return (
    <section className="container-pad py-6 sm:py-8 md:py-10 lg:py-12">
      <div
        className="relative isolate overflow-hidden rounded-[1.75rem] border border-slate-200/70 shadow-premium sm:rounded-[2rem]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeSlide.id}
            src={activeSlide.imageUrl}
            alt={activeSlide.title || "Premium living room setup"}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            initial={{ opacity: 0.35, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.35, scale: 1.01 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = DEFAULT_HERO_IMAGE;
            }}
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/72 via-slate-900/40 to-slate-950/12" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_42%),linear-gradient(180deg,transparent_26%,rgba(0,0,0,0.16)_100%),linear-gradient(90deg,rgba(255,255,255,0.03),transparent_34%,rgba(0,0,0,0.06))]" />

        <div className="relative flex min-h-[420px] items-center px-4 py-10 sm:min-h-[500px] sm:px-7 md:min-h-[560px] md:px-10 md:py-12 lg:min-h-[620px] lg:px-12 lg:py-14">
          <motion.div
            key={`content-${activeSlide.id}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="max-w-[36rem] space-y-3.5 rounded-[1.2rem] border border-white/8 bg-slate-950/14 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)] backdrop-blur-[6px] sm:space-y-4 sm:p-5 md:p-5.5"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/6 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/78 shadow-sm backdrop-blur-sm sm:px-3 sm:text-[11px]">
              <BadgePercent size={14} /> New Season Offer up to 35% Off
            </span>

            <h1 className="max-w-3xl font-display text-[clamp(1.7rem,3.8vw,3.4rem)] font-semibold leading-[1.06] tracking-[-0.025em] text-[#fff8ef] drop-shadow-[0_2px_14px_rgba(0,0,0,0.28)]">
              {activeSlide.title}
            </h1>

            <p className="max-w-2xl rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-[0.93rem] font-normal leading-relaxed text-white/84 shadow-sm backdrop-blur-sm sm:px-5 sm:py-4 md:text-base">
              {activeSlide.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 sm:gap-2.5">
              <RoutePrefetchLink
                routeKey="shop"
                to={activeSlide.buttonLink || "/shop"}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/16 transition duration-300 hover:scale-[1.01] hover:bg-brand-dark hover:shadow-brand/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                {activeSlide.buttonText || "Shop Now"} <ArrowRight size={16} />
              </RoutePrefetchLink>

              <span className="hidden rounded-full border border-white/8 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/64 backdrop-blur-sm sm:inline-flex">
                Premium collection
              </span>
            </div>
          </motion.div>

          {slides.length > 1 ? (
            <>
              <motion.button
                type="button"
                onClick={goPrev}
                aria-label="Previous hero slide"
                animate={floatingControlMotion}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/8 bg-white/6 text-white/82 shadow-sm shadow-slate-950/12 backdrop-blur-sm transition duration-300 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <ChevronLeft size={15} />
              </motion.button>
              <motion.button
                type="button"
                onClick={goNext}
                aria-label="Next hero slide"
                animate={{ ...floatingControlMotion, y: [0, 2, 0] }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/8 bg-white/6 text-white/82 shadow-sm shadow-slate-950/12 backdrop-blur-sm transition duration-300 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <ChevronRight size={15} />
              </motion.button>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/8 bg-white/6 px-2.5 py-1.5 shadow-[0_6px_18px_rgba(15,23,42,0.1)] backdrop-blur-sm">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Go to hero slide ${index + 1}`}
                    onClick={() => setActiveIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? "w-6.5 bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
                        : "w-2 bg-white/40 hover:bg-white/65"
                    }`}
                  />
                ))}
              </div>

              <div className="absolute right-4 top-4 rounded-full border border-white/8 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/72 shadow-[0_6px_16px_rgba(15,23,42,0.1)] backdrop-blur-sm">
                {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;