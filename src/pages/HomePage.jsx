import { lazy, Suspense, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import HeroSection from "../components/home/HeroSection";
import LazySection from "../components/common/LazySection";
import RoutePrefetchLink from "../components/common/RoutePrefetchLink";
import SectionSkeleton from "../components/common/SectionSkeleton";
import { useStore } from "../context/StoreContext";
import { categories } from "../data/products";
import { warmLikelyStorefrontRoutes } from "../utils/performance/prefetchRoutes";

// Keep only above-the-fold content eager and defer all heavy secondary sections.
const CategorySection = lazy(() => import("../components/home/CategorySection"));
const ProductGrid = lazy(() => import("../components/products/ProductGrid"));
const PromoBanner = lazy(() => import("../components/home/PromoBanner"));
const BenefitsSection = lazy(() => import("../components/home/BenefitsSection"));
const TestimonialsSection = lazy(() => import("../components/home/TestimonialsSection"));
const BrandLogosSection = lazy(() => import("../components/home/BrandLogosSection"));
const NewsletterSection = lazy(() => import("../components/home/NewsletterSection"));

function HomePage() {
  const { loadingProducts, products } = useStore();

  useEffect(() => {
    // Prefetch likely next route during idle time to improve first interaction latency.
    warmLikelyStorefrontRoutes();
  }, []);

  const sortedByRating = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const sortedByNew = [...products].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  const bestSelling = sortedByRating.slice(0, 6);
  const newArrivals = sortedByNew.slice(0, 6);

  return (
    <>
      {/* Critical above-the-fold content remains eager for fast LCP. */}
      <HeroSection />

      <LazySection
        minHeight={420}
        fallback={<SectionSkeleton minHeight={420} title="Preparing categories..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={420} title="Preparing categories..." />}>
          <CategorySection categories={categories} />
        </Suspense>
      </LazySection>

      <LazySection
        minHeight={520}
        fallback={<SectionSkeleton minHeight={520} title="Loading best sellers..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={520} title="Loading best sellers..." />}>
          <section className="container-pad py-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Best Selling
                </p>
                <h2 className="font-display text-3xl font-bold">Most loved pieces</h2>
              </div>
              <RoutePrefetchLink
                to="/shop"
                routeKey="shop"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand"
              >
                View all products <ArrowRight size={15} />
              </RoutePrefetchLink>
            </div>
            {loadingProducts ? (
              <div className="rounded-xl bg-white p-10 text-center text-muted">Loading products...</div>
            ) : (
              <ProductGrid products={bestSelling} />
            )}
          </section>
        </Suspense>
      </LazySection>

      <LazySection
        minHeight={340}
        fallback={<SectionSkeleton minHeight={340} title="Loading offers..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={340} title="Loading offers..." />}>
          <PromoBanner />
        </Suspense>
      </LazySection>

      <LazySection
        minHeight={520}
        fallback={<SectionSkeleton minHeight={520} title="Loading new arrivals..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={520} title="Loading new arrivals..." />}>
          <section className="container-pad py-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  New Arrivals
                </p>
                <h2 className="font-display text-3xl font-bold">Freshly added this week</h2>
              </div>
              <RoutePrefetchLink
                to="/shop"
                routeKey="shop"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand"
              >
                Discover now <ArrowRight size={15} />
              </RoutePrefetchLink>
            </div>
            {loadingProducts ? (
              <div className="rounded-xl bg-white p-10 text-center text-muted">Loading products...</div>
            ) : (
              <ProductGrid products={newArrivals} />
            )}
          </section>
        </Suspense>
      </LazySection>

      <LazySection
        minHeight={280}
        fallback={<SectionSkeleton minHeight={280} title="Loading benefits..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={280} title="Loading benefits..." />}>
          <BenefitsSection />
        </Suspense>
      </LazySection>

      <LazySection
        minHeight={260}
        fallback={<SectionSkeleton minHeight={260} title="Loading testimonials..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={260} title="Loading testimonials..." />}>
          <TestimonialsSection />
        </Suspense>
      </LazySection>

      <LazySection
        minHeight={220}
        fallback={<SectionSkeleton minHeight={220} title="Loading partner brands..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={220} title="Loading partner brands..." />}>
          <BrandLogosSection />
        </Suspense>
      </LazySection>

      <LazySection
        minHeight={280}
        fallback={<SectionSkeleton minHeight={280} title="Loading newsletter..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={280} title="Loading newsletter..." />}>
          <NewsletterSection />
        </Suspense>
      </LazySection>
    </>
  );
}

export default HomePage;