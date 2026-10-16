import { cn } from "~/lib/utils";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
};

const markSizeStyles = {
  sm: "size-6 text-[11px]",
  md: "size-8 text-sm",
  lg: "size-10 text-base",
};

const wordmarkSizeStyles = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function Logo({
  size = "sm",
  showWordmark = false,
  className,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-[var(--radius)] bg-foreground font-mono font-bold text-background select-none shrink-0",
          markSizeStyles[size],
        )}
        aria-hidden="true"
      >
        F
      </div>
      {showWordmark ? (
        <span
          className={cn(
            "font-mono font-semibold tracking-wider text-foreground select-none",
            wordmarkSizeStyles[size],
          )}
        >
          FTHEFORM
        </span>
      ) : null}
    </div>
  );
}
