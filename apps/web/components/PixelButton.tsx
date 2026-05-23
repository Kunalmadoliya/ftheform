"use client"

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";
import { sfx } from "../lib/sound";

type Variant = "primary" | "ink" | "ghost" | "leaf";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground border-2 border-quest-ink",
  ink: "bg-quest-ink text-quest-cream border-2 border-quest-ink",
  leaf: "bg-accent text-accent-foreground border-2 border-quest-ink",
  ghost: "bg-card text-foreground border-2 border-quest-ink",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export const PixelButton = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", onMouseEnter, onClick, ...rest }, ref) => (
    <button
      ref={ref}
      onMouseEnter={(e) => { sfx.hover(); onMouseEnter?.(e); }}
      onClick={(e) => { sfx.click(); onClick?.(e); }}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-pixel uppercase tracking-wider rounded-sm shadow-pixel btn-press select-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    />
  )
);
PixelButton.displayName = "PixelButton";
