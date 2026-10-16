"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type StarRatingProps = {
  label: string;
  maxStars: number;
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function StarRating({
  label,
  maxStars,
  value,
  onChange,
  disabled = false,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number>();
  const count = Number.isSafeInteger(maxStars) && maxStars > 0 ? Math.min(maxStars, 10) : 5;
  const previewValue = hoveredStar ?? value ?? 0;

  return (
    <div
      className="flex flex-wrap items-center gap-2 py-1"
      role="radiogroup"
      aria-label={label}
      onMouseLeave={() => setHoveredStar(undefined)}
    >
      {Array.from({ length: count }, (_, index) => {
        const star = index + 1;
        const isFilled = star <= previewValue;
        const isSelected = value === star;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${star} of ${count} stars`}
            disabled={disabled}
            className={`group relative flex size-10 items-center justify-center rounded-[var(--radius)] border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-125 hover:scale-110 motion-reduce:transform-none disabled:pointer-events-none disabled:opacity-50 ${
              isFilled
                ? "border-foreground bg-foreground/5 text-foreground"
                : "border-border/70 bg-card text-muted-foreground/40 hover:border-foreground/30 hover:text-muted-foreground"
            }`}
            onMouseEnter={() => setHoveredStar(star)}
            onFocus={() => setHoveredStar(star)}
            onBlur={() => setHoveredStar(undefined)}
            onClick={() => onChange(star)}
          >
            <Star
              className={`size-5 transition-all duration-150 ${
                isFilled ? "fill-foreground text-foreground" : "text-muted-foreground/50"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
