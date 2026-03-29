import { useEffect, useRef, useState } from "react";

export function useNearScreen({ rootMargin = "300px", triggerOnce = true } = {}) {
  const ref = useRef(null);
  const [isNearScreen, setIsNearScreen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearScreen(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsNearScreen(false);
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin, triggerOnce]);

  return { ref, isNearScreen };
}

export default useNearScreen;
