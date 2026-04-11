import { Star } from "lucide-react";
import { useId, useMemo, useState } from "react";

const clampRating = (value) => Math.max(0, Math.min(5, Number(value || 0)));

function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  disabled = false,
  size = 22,
  className = "",
  showLabel = true,
  labelPrefix = "",
}) {
  const generatedId = useId();
  const [hoveredValue, setHoveredValue] = useState(0);

  const normalizedValue = clampRating(value);
  const previewValue = readOnly ? normalizedValue : clampRating(hoveredValue || normalizedValue);
  const isInteractive = !readOnly && !disabled && typeof onChange === "function";

  const label = useMemo(() => {
    const activeValue = Math.round(normalizedValue);
    if (activeValue <= 0) return "No rating selected";
    return `${activeValue} Star${activeValue > 1 ? "s" : ""}`;
  }, [normalizedValue]);

  const updateRating = (nextValue) => {
    if (!isInteractive) return;
    onChange(clampRating(nextValue));
  };

  const handleKeyDown = (event) => {
    if (!isInteractive) return;

    const current = Math.round(normalizedValue);

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      updateRating(Math.min(5, current + 1));
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      updateRating(Math.max(1, current - 1 || 1));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      updateRating(1);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      updateRating(5);
    }
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <div
        role={readOnly ? "img" : "radiogroup"}
        aria-label={readOnly ? `Rating: ${label}` : "Select product rating"}
        className="inline-flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((starValue) => {
          const active = starValue <= previewValue;
          const iconClass = active
            ? "text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.35)]"
            : "text-slate-300";

          if (readOnly) {
            return (
              <span key={`${generatedId}-${starValue}`} className="inline-flex">
                <Star size={size} strokeWidth={1.8} className={`${iconClass} transition-colors`} fill={active ? "currentColor" : "none"} />
              </span>
            );
          }

          return (
            <button
              key={`${generatedId}-${starValue}`}
              type="button"
              role="radio"
              aria-checked={Math.round(normalizedValue) === starValue}
              aria-label={`${starValue} Star${starValue > 1 ? "s" : ""}`}
              disabled={!isInteractive}
              onMouseEnter={() => setHoveredValue(starValue)}
              onMouseLeave={() => setHoveredValue(0)}
              onFocus={() => setHoveredValue(starValue)}
              onBlur={() => setHoveredValue(0)}
              onKeyDown={handleKeyDown}
              onClick={() => updateRating(starValue)}
              className="inline-flex rounded-sm p-0.5 outline-none transition-transform duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Star size={size} strokeWidth={1.8} className={`${iconClass} transition-colors duration-150`} fill={active ? "currentColor" : "none"} />
            </button>
          );
        })}
      </div>

      {showLabel ? (
        <span className="text-sm font-medium text-slate-600">
          {labelPrefix ? `${labelPrefix} ` : ""}
          {label}
        </span>
      ) : null}
    </div>
  );
}

export default StarRating;
