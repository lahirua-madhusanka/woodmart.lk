import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import HeroSection from "../components/home/HeroSection";
import StorefrontBannerSection from "../components/banners/StorefrontBannerSection";
import LazySection from "../components/common/LazySection";
import RoutePrefetchLink from "../components/common/RoutePrefetchLink";
import SectionSkeleton from "../components/common/SectionSkeleton";
import { getHomepageDataApi, getCachedHomepageData, announceHomepageData } from "../services/homepageDataService";
import { warmLikelyStorefrontRoutes } from "../utils/performance/prefetchRoutes";

// Keep only above-the-fold content eager and defer all heavy secondary sections.
const CategorySection = lazy(() => import("../components/home/CategorySection"));
const ProductGrid = lazy(() => import("../components/products/ProductGrid"));
const BenefitsSection = lazy(() => import("../components/home/BenefitsSection"));
const TestimonialsSection = lazy(() => import("../components/home/TestimonialsSection"));
const BrandLogosSection = lazy(() => import("../components/home/BrandLogosSection"));
const NewsletterSection = lazy(() => import("../components/home/NewsletterSection"));
const EMPTY_BANNERS = [];

function HomePage() {
  const cachedHomepageData = useMemo(() => getCachedHomepageData(), []);
  const [homepageProducts, setHomepageProducts] = useState(() => ({
    bestSellers: Array.isArray(cachedHomepageData?.bestSellers) ? cachedHomepageData.bestSellers : [],
    newArrivals: Array.isArray(cachedHomepageData?.newArrivals) ? cachedHomepageData.newArrivals : [],
    featuredCategories: Array.isArray(cachedHomepageData?.featuredCategories) ? cachedHomepageData.featuredCategories : [],
    testimonials: Array.isArray(cachedHomepageData?.testimonials) ? cachedHomepageData.testimonials : [],
  }));
  const [homepageBanners, setHomepageBanners] = useState(() => cachedHomepageData?.banners || {});
  const [loadingProducts, setLoadingProducts] = useState(() => !cachedHomepageData);
  const products = useMemo(
    () => [...homepageProducts.bestSellers, ...homepageProducts.newArrivals],
    [homepageProducts.bestSellers, homepageProducts.newArrivals]
  );
  const hasProducts = products.length > 0;

  const fallbackFeaturedCategories = useMemo(() => {
    const categoryMap = new Map();

    for (const item of products || []) {
      const categoryName = String(item?.category || "Other").trim() || "Other";
      const existing = categoryMap.get(categoryName);

      if (existing) {
        existing.count += 1;
        continue;
      }

      categoryMap.set(categoryName, {
        id: categoryName.toLowerCase().replace(/\s+/g, "-"),
        name: categoryName,
        image: item?.images?.[0] || item?.image || "",
        count: 1,
      });
    }

    return [...categoryMap.values()]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 4);
  }, [products]);

  const featuredCategories = homepageProducts.featuredCategories.length
    ? homepageProducts.featuredCategories
    : fallbackFeaturedCategories;

  useEffect(() => {
    // Prefetch likely next route during idle time to improve first interaction latency.
    warmLikelyStorefrontRoutes();
    if (cachedHomepageData) {
      announceHomepageData(cachedHomepageData);
    }
  }, [cachedHomepageData]);

  useEffect(() => {
    let ignore = false;

    const loadHomepageData = async () => {
      setLoadingProducts(!cachedHomepageData);
      try {
        const data = await getHomepageDataApi();
        if (!ignore) {
          setHomepageProducts({
            bestSellers: Array.isArray(data?.bestSellers) ? data.bestSellers : [],
            newArrivals: Array.isArray(data?.newArrivals) ? data.newArrivals : [],
            featuredCategories: Array.isArray(data?.featuredCategories) ? data.featuredCategories : [],
            testimonials: Array.isArray(data?.testimonials) ? data.testimonials : [],
          });
          setHomepageBanners(data?.banners || {});
        }
      } catch {
        if (!ignore && !cachedHomepageData) {
          setHomepageProducts({ bestSellers: [], newArrivals: [], featuredCategories: [], testimonials: [] });
          setHomepageBanners({});
        }
      } finally {
        if (!ignore) {
          setLoadingProducts(false);
        }
      }
    };

    loadHomepageData();

    return () => {
      ignore = true;
    };
  }, [cachedHomepageData]);

  const bestSelling = homepageProducts.bestSellers;
  const newArrivals = homepageProducts.newArrivals;
  const customerTestimonials = homepageProducts.testimonials;

  return (
    <>
      {/* Critical above-the-fold content remains eager for fast LCP. */}
      <HeroSection />

      <LazySection
        minHeight={420}
        fallback={<SectionSkeleton minHeight={420} title="Preparing categories..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={420} title="Preparing categories..." />}>
          {hasProducts && featuredCategories.length ? (
            <CategorySection categories={featuredCategories} />
          ) : (
            <section className="container-pad py-10">
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-sm text-muted">
                No products available yet.
              </div>
            </section>
          )}
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
              <ProductGrid products={newArrivals} emptyMessage="No products available yet." />
            )}
          </section>
        </Suspense>
      </LazySection>

      <LazySection
        minHeight={340}
        fallback={<SectionSkeleton minHeight={340} title="Loading offers..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={340} title="Loading offers..." />}>
          <StorefrontBannerSection section="promo_strip" columns={2} containerClassName="container-pad py-8" initialBanners={homepageBanners.promo_strip || EMPTY_BANNERS} />
        </Suspense>
      </LazySection>

      <LazySection
        minHeight={280}
        fallback={<SectionSkeleton minHeight={280} title="Loading category promotions..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={280} title="Loading category promotions..." />}>
          <StorefrontBannerSection section="category_promo" columns={2} containerClassName="container-pad py-8" initialBanners={homepageBanners.category_promo || EMPTY_BANNERS} />
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
              <ProductGrid products={bestSelling} emptyMessage="No products available yet." />
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
        fallback={<SectionSkeleton minHeight={260} title="Loading featured promotions..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={260} title="Loading featured promotions..." />}>
          <StorefrontBannerSection section="featured_section" columns={1} containerClassName="container-pad py-8" initialBanners={homepageBanners.featured_section || EMPTY_BANNERS} />
        </Suspense>
      </LazySection>

      <LazySection
        minHeight={260}
        fallback={<SectionSkeleton minHeight={260} title="Loading testimonials..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={260} title="Loading testimonials..." />}>
          <TestimonialsSection testimonials={customerTestimonials} />
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
        minHeight={260}
        fallback={<SectionSkeleton minHeight={260} title="Loading additional banners..." />}
      >
        <Suspense fallback={<SectionSkeleton minHeight={260} title="Loading additional banners..." />}>
          <StorefrontBannerSection section="secondary_banner" columns={2} containerClassName="container-pad py-8" initialBanners={homepageBanners.secondary_banner || EMPTY_BANNERS} />
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
