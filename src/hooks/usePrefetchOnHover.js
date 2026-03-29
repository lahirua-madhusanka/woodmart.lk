import { useCallback, useMemo, useRef } from "react";
import { prefetchRoute } from "../utils/performance/prefetchRoutes";

export function usePrefetchOnHover(routeKey, options = {}) {
  const prefetchedRef = useRef(false);

  const trigger = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchRoute(routeKey, options);
    prefetchedRef.current = true;
  }, [options, routeKey]);

  return useMemo(
    () => ({
      onMouseEnter: trigger,
      onFocus: trigger,
      onTouchStart: trigger,
    }),
    [trigger]
  );
}

export function usePrefetchTrigger(routeKey, options = {}) {
  return useCallback(() => {
    prefetchRoute(routeKey, options);
  }, [options, routeKey]);
}

export default usePrefetchOnHover;
