import { Link } from "react-router-dom";
import { usePrefetchOnHover } from "../../hooks/usePrefetchOnHover";

function RoutePrefetchLink({ routeKey, prefetchOptions, ...props }) {
  const prefetchHandlers = usePrefetchOnHover(routeKey, prefetchOptions);

  const onMouseEnter = (event) => {
    props.onMouseEnter?.(event);
    prefetchHandlers.onMouseEnter(event);
  };

  const onFocus = (event) => {
    props.onFocus?.(event);
    prefetchHandlers.onFocus(event);
  };

  const onTouchStart = (event) => {
    props.onTouchStart?.(event);
    prefetchHandlers.onTouchStart(event);
  };

  return <Link {...props} onMouseEnter={onMouseEnter} onFocus={onFocus} onTouchStart={onTouchStart} />;
}

export default RoutePrefetchLink;
