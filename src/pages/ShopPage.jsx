import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/products/ProductCard";
import { getProductCardsApi, getProductCategoriesApi } from "../services/productService";


const TOP_SECTION_PRODUCT_COUNT = 4;
const INITIAL_VISIBLE_PRODUCTS = 24;
const LOAD_MORE_STEP = 12;

function ShopPage() {
  const [params, setParams] = useSearchParams();
  const urlCategory = (params.get("category") || "").trim();
  const urlQuery = (params.get("q") || "").trim();

  const [search, setSearch] = useState(urlQuery);
  const [category, setCategory] = useState(urlCategory || "All");
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(200000);
  const [sortBy, setSortBy] = useState("new");
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setSearch(urlQuery);
    setCategory(urlCategory || "All");
    setPage(1);
  }, [urlCategory, urlQuery]);

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      const isFirstPage = page === 1;
      const requestLimit = isFirstPage ? INITIAL_VISIBLE_PRODUCTS : LOAD_MORE_STEP;
      const requestOffset = isFirstPage ? 0 : INITIAL_VISIBLE_PRODUCTS + (page - 2) * LOAD_MORE_STEP;

      if (isFirstPage) {
        setLoadingCatalog(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const data = await getProductCardsApi({
          category: category === "All" ? undefined : category,
          q: search.trim() || undefined,
          minRating: minRating || undefined,
          maxPrice,
          sort: sortBy,
          page,
          offset: requestOffset,
          limit: requestLimit,
        });

        if (!ignore) {
          const items = Array.isArray(data?.items) ? data.items : [];
          setCatalog((current) => (isFirstPage ? items : [...current, ...items]));
          setPagination(data?.pagination || { total: items.length, hasMore: false });
        }
      } catch {
        if (!ignore) {
          if (isFirstPage) {
            setCatalog([]);
          }
          setPagination({ total: 0, hasMore: false });
        }
      } finally {
        if (!ignore) {
          setLoadingCatalog(false);
          setLoadingMore(false);
        }
      }
    };

    loadProducts();

    return () => {
      ignore = true;
    };
  }, [category, maxPrice, minRating, page, search, sortBy]);

  useEffect(() => {
    let ignore = false;

    const loadCategories = async () => {
      try {
        const data = await getProductCategoriesApi();
        if (!ignore) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!ignore) {
          setCategories([]);
        }
      }
    };

    loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  const updateQueryParam = (key, value) => {
    const nextParams = new URLSearchParams(params);
    if (value == null || value === "" || value === "All") {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setParams(nextParams, { replace: true });
  };

  const uniqueCategories = useMemo(
    () => {
      const names = categories
        .map((item) => (item?.name ? item.name : item))
        .filter(Boolean);

      return ["All", ...new Set(names)];
    },
    [categories]
  );

  const topSectionProducts = catalog.slice(0, TOP_SECTION_PRODUCT_COUNT);
  const remainingProducts = catalog.slice(TOP_SECTION_PRODUCT_COUNT);

  const resetProductPage = () => {
    setPage(1);
  };

  const onCategoryChange = (nextCategory) => {
    setCategory(nextCategory);
    resetProductPage();
    updateQueryParam("category", nextCategory);
  };

  const onSearchChange = (value) => {
    setSearch(value);
    resetProductPage();
  };

  return (
    <section className="container-pad py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Shop</p>
          <h1 className="font-display text-3xl font-bold">All Products</h1>
        </div>
        <div className="text-sm text-muted">{pagination.total || catalog.length} products found</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit space-y-5 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink">
            <SlidersHorizontal size={15} /> Filters
          </h2>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Search</span>
            <span className="flex items-center rounded-lg border border-slate-300 px-3 py-2">
              <Search size={15} className="text-muted" />
              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                  }
                }}
                placeholder="Find products"
                className="ml-2 w-full text-sm outline-none"
              />
            </span>
          </label>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Category</h3>
            <div className="space-y-2">
              {uniqueCategories.map((entry) => (
                <label key={entry} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    className="accent-brand"
                    checked={category === entry}
                    onChange={() => onCategoryChange(entry)}
                  />
                  {entry}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Price up to Rs. {Number(maxPrice).toLocaleString()}</h3>
            <input
              type="range"
              min={0}
              max={200000}
              step={500}
              value={maxPrice}
              onChange={(event) => {
                setMaxPrice(Number(event.target.value));
                resetProductPage();
              }}
              className="w-full accent-brand"
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Minimum Rating</h3>
            <select
              value={minRating}
              onChange={(event) => {
                setMinRating(Number(event.target.value));
                resetProductPage();
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
            >
              <option value={0}>All</option>
              <option value={4}>4+ stars</option>
              <option value={4.5}>4.5+ stars</option>
              <option value={4.8}>4.8+ stars</option>
            </select>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex justify-end">
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                resetProductPage();
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="new">Newest</option>
              <option value="featured">Sort: Featured</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {loadingCatalog ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-muted">
              Loading catalog...
            </div>
          ) : catalog.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-muted">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {topSectionProducts.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {!loadingCatalog && catalog.length > 0 && remainingProducts.length > 0 ? (
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              {remainingProducts.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
          </div>
        ) : null}

        {pagination.hasMore && (
          <div className="mt-2 text-center lg:col-span-2">
            <button
              onClick={() => setPage((current) => current + 1)}
              disabled={loadingMore}
              className="btn-secondary"
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default ShopPage;
