import { memo, useEffect, useMemo, useState } from "react";
import RoutePrefetchLink from "../common/RoutePrefetchLink";
import { getStorefrontBannersBySectionApi } from "../../services/storefrontBannersService";
import { getOptimizedImageKitUrl } from "../../utils/imageKit";

const sectionLabelMap = {
  promo_strip: "",
  category_promo: "",
  featured_section: "",
  secondary_banner: "",
};

function BannerAction({ banner }) {
  if (!banner?.buttonText || !banner?.buttonLink) return null;

  if (banner.buttonLink.startsWith("/")) {
    return (
      <RoutePrefetchLink
        to={banner.buttonLink}
        routeKey="shop"
        className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        {banner.buttonText}
      </RoutePrefetchLink>
    );
  }

  return (
    <a
      href={banner.buttonLink}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
    >
      {banner.buttonText}
    </a>
  );
}

function StorefrontBannerSection({ section, columns = 2, containerClassName = "", initialBanners = null }) {
  const normalizedInitialBanners = useMemo(
    () => (Array.isArray(initialBanners) ? initialBanners : null),
    [initialBanners]
  );
  const [banners, setBanners] = useState(() => normalizedInitialBanners || []);
  const [loading, setLoading] = useState(() => !normalizedInitialBanners);

  const getLayoutClassName = (count) => {
    if (columns === 1) return "grid-cols-1";
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  };

  useEffect(() => {
    if (normalizedInitialBanners) {
      setBanners(normalizedInitialBanners);
      setLoading(false);
      return undefined;
    }

    let ignore = false;

    const load = async () => {
      try {
        const data = await getStorefrontBannersBySectionApi(section);
        if (!ignore) {
          setBanners(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!ignore) {
          setBanners([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [normalizedInitialBanners, section]);

  if (loading) {
    return (
      <section className={containerClassName}>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-muted">
          Loading banners...
        </div>
      </section>
    );
  }

  if (!banners.length) {
    return null;
  }

  const layoutClassName = getLayoutClassName(banners.length);

  return (
    <section className={containerClassName}>
      <div className={`grid gap-4 ${layoutClassName}`}>
        {banners.map((banner) => (
          <article key={banner.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white transition-all duration-500 hover:border-brand hover:shadow-[0_0_0_1px_rgba(9,89,164,0.55)]">
            <img
              src={getOptimizedImageKitUrl(banner.imageUrl, { width: columns === 1 ? 1800 : 1100, quality: 90 })}
              alt={banner.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-75 transition-transform duration-[5000ms] ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />
            <div className="relative z-10 max-w-md space-y-3 rounded-2xl border border-white/15 bg-black/25 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.22)] backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-light">
                {sectionLabelMap[banner.section] || sectionLabelMap[section]}
              </p>
              <h3 className="font-display text-3xl font-semibold leading-tight">{banner.title}</h3>
              {banner.subtitle ? <p className="text-sm text-white/90">{banner.subtitle}</p> : null}
              <BannerAction banner={banner} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default memo(StorefrontBannerSection);
