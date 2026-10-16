"use client";

type ProgressLineProps = {
  current: number;
  total: number;
  isSavingDraft?: boolean;
};

export function ProgressLine({ current, total, isSavingDraft = false }: ProgressLineProps) {
  const percentage = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
        <span>
          {current} of {total}
        </span>
        <span className="transition-colors duration-150">
          {isSavingDraft ? "Saving..." : "Saved"}
        </span>
      </div>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-border/60"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Question ${current} of ${total}`}
      >
        <div
          className="h-full bg-foreground transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
