import clsx from "clsx";

export function StarRating({
  stars,
  className,
  size = "sm",
}: {
  stars: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const safe = Math.max(1, Math.min(5, Math.round(stars)));

  return (
    <span
      role="img"
      aria-label={`${safe} out of 5 stars`}
      className={clsx(
        "inline-flex items-center tracking-[0.08em]",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-2xl",
        className,
      )}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={index < safe ? "text-gold-400" : "text-ink-600"}
        >
          {index < safe ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}
