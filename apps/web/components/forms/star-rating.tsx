"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type StarRatingProps = {
  label: string;
  maxStars: number;
  value?: number;
  onChange: (value: number) => void;
};

export function StarRating({ label, maxStars, value, onChange }: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number>();
  const count = Number.isSafeInteger(maxStars) && maxStars > 0 ? Math.min(maxStars, 10) : 5;
  const previewValue = hoveredStar ?? value ?? 0;

  return (
    <div
      className="flex gap-1"
      role="radiogroup"
      aria-label={label}
      onMouseLeave={() => setHoveredStar(undefined)}
    >
      {Array.from({ length: count }, (_, index) => {
        const star = index + 1;
        const isFilled = star <= previewValue;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} of ${count} stars`}
            className="rounded-sm p-1 text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onMouseEnter={() => setHoveredStar(star)}
            onFocus={() => setHoveredStar(star)}
            onBlur={() => setHoveredStar(undefined)}
            onClick={() => onChange(star)}
          >
            <Star className={`size-6 ${isFilled ? "fill-current" : "text-muted-foreground"}`} />
          </button>
        );
      })}
    </div>
  );
}
