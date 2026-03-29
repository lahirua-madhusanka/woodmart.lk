import { useEffect, useState } from "react";
import PageLoader from "./PageLoader";

function PageFallbackLoader({ label, delay = 120 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return <PageLoader label={label} />;
}

export default PageFallbackLoader;
