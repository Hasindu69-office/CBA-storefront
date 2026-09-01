type ProductCardRatingValue = {
  average: number
  count: number
} | null

type ProductCardRatingProps = {
  rating: ProductCardRatingValue
  compact?: boolean
}

export default function ProductCardRating({
  rating,
  compact = false,
}: ProductCardRatingProps) {
  const hasReviews = Boolean(rating && rating.count > 0)
  const roundedRating = hasReviews
    ? Math.max(0, Math.min(5, Math.round(rating!.average)))
    : 0
  const label = hasReviews
    ? `${rating!.average.toFixed(1)} out of 5 stars from ${rating!.count} ${
        rating!.count === 1 ? "review" : "reviews"
      }`
    : "No reviews yet"

  return (
    <span
      className={[
        "flex min-w-0 flex-shrink-0 items-center gap-1",
        compact
          ? "text-[8px] leading-3 xsmall:text-[9px] medium:text-[10px] medium:leading-4"
          : "text-[10px] leading-4",
      ].join(" ")}
      aria-label={label}
    >
      <span
        className={[
          "inline-flex flex-shrink-0 items-center leading-none",
          compact ? "h-3 gap-px medium:h-3.5" : "h-4 gap-0.5",
        ].join(" ")}
        aria-hidden="true"
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon
            key={index}
            filled={index < roundedRating}
            compact={compact}
          />
        ))}
      </span>
      {hasReviews && (
        <>
          <span className="font-bold text-black">{rating!.average.toFixed(1)}</span>
          <span className="text-[#8a8a8f]">({rating!.count})</span>
        </>
      )}
    </span>
  )
}

function StarIcon({
  filled,
  compact,
}: {
  filled: boolean
  compact: boolean
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={[
        compact ? "h-2.5 w-2.5 medium:h-3 medium:w-3" : "h-3.5 w-3.5",
        filled ? "text-brand" : "text-[#d4d4d8]",
      ].join(" ")}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <path d="m10 2.5 2.2 4.5 4.9.7-3.5 3.4.8 4.9-4.4-2.3L5.6 16l.8-4.9L2.9 7.7l4.9-.7L10 2.5Z" />
    </svg>
  )
}
