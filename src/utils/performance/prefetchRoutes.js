const routeLoaders = {
  shop: () => import("../../pages/ShopPage"),
  customProject: () => import("../../pages/CustomProjectPage"),
  productDetails: () => import("../../pages/ProductDetailsPage"),
  cart: () => import("../../pages/CartPage"),
  wishlist: () => import("../../pages/WishlistPage"),
  auth: () => import("../../pages/AuthPage"),
  admin: () => import("../../admin/layout/AdminLayout"),
};

const prefetched = new Set();

const shouldPrefetch = () => {
  if (typeof window === "undefined") return false;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData) return false;
  if (connection?.effectiveType && /2g/.test(connection.effectiveType)) return false;
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return false;

  return true;
};

const runLoader = (key) => {
  if (prefetched.has(key)) return;
  const loader = routeLoaders[key];
  if (!loader) return;
  prefetched.add(key);
  loader().catch(() => {
    prefetched.delete(key);
  });
};

export const prefetchRoute = (key, { immediate = false, allow = true } = {}) => {
  if (!allow || !shouldPrefetch()) return;

  if (immediate) {
    runLoader(key);
    return;
  }

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(() => runLoader(key), { timeout: 1200 });
  } else {
    setTimeout(() => runLoader(key), 250);
  }
};

export const warmLikelyStorefrontRoutes = () => {
  prefetchRoute("shop");
};

export default prefetchRoute;
