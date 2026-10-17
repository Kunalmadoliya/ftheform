"use client";

import { IconAi, IconSpinner } from "~/components/icons/app-icons";
import { Button } from "~/components/ui/button";

interface BuyCreditsButtonProps {
  onBuy: () => void;
  isBuying: boolean;
  buyingLabel?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}

export function BuyCreditsButton({
  onBuy,
  isBuying,
  buyingLabel,
  className,
  size = "sm",
  variant = "default",
}: BuyCreditsButtonProps) {
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={isBuying}
      onClick={onBuy}
      className={className}
    >
      {isBuying ? (
        <>
          <IconSpinner className="size-3.5 animate-spin" />
          <span>{buyingLabel || "Processing..."}</span>
        </>
      ) : (
        <>
          <IconAi className="size-3.5 text-amber-500" />
          <span>Rs. 400 for 20 generations</span>
        </>
      )}
    </Button>
  );
}
