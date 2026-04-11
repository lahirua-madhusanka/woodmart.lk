import { Star } from "lucide-react";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeRating = (value) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return 0;
  return clamp(numeric, 0, 5);
};

function StarGlyph({ fillPercent = 0, size = 14 }) {
  const boundedPercent = clamp(Number(fillPercent || 0), 0, 100);

  return (
    <span className="relative inline-flex" style={{ width: size, height: size }} aria-hidden="true">
      <Star size={size} strokeWidth={1.9} className="text-slate-300" fill="none" />
      {boundedPercent > 0 ? (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${boundedPercent}%` }}
        >
          <Star size={size} strokeWidth={1.9} className="text-amber-500" fill="currentColor" />
        </span>
      ) : null}
    </span>
  );
}

function StarRatingDisplay({
  rating = 0,
  reviewCount = 0,
  showValue = true,
  size = 14,
  className = "",
}) {
  const normalizedRating = normalizeRating(rating);
  const safeReviewCount = Math.max(0, Number(reviewCount || 0));

  const starFillPercents = [1, 2, 3, 4, 5].map((starNumber) => {
    const fill = clamp(normalizedRating - (starNumber - 1), 0, 1);
    return Math.round(fill * 100);
  });

  const hasReviews = safeReviewCount > 0;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`.trim()}
      aria-label={
        hasReviews
          ? `Rated ${normalizedRating.toFixed(1)} out of 5 from ${safeReviewCount} reviews`
          : "No reviews yet"
      }
    >
      <div className="flex items-center gap-0.5">
        {starFillPercents.map((fillPercent, index) => (
          <StarGlyph key={`star-${index + 1}`} fillPercent={fillPercent} size={size} />
        ))}
      </div>

      {showValue ? (
        <span className="text-xs font-semibold text-ink">{normalizedRating.toFixed(1)}</span>
      ) : null}

      <span className="text-xs text-muted">
        {hasReviews ? `(${safeReviewCount})` : "No reviews"}
      </span>
    </div>
  );
}

export default StarRatingDisplay;
