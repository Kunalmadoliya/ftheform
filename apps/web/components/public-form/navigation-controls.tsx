"use client";

import { IconChevronLeft, IconChevronRight, IconSpinner } from "~/components/icons/app-icons";
import { Button } from "~/components/ui/button";

type NavigationControlsProps = {
  currentStep: number;
  totalSteps: number;
  isOwner?: boolean;
  isSubmitting?: boolean;
  isSavingDraft?: boolean;
  isVersionMismatch?: boolean;
  onBack: () => void;
  onNext: () => void;
  isTextarea?: boolean;
};

export function NavigationControls({
  currentStep,
  totalSteps,
  isOwner = false,
  isSubmitting = false,
  isSavingDraft = false,
  isVersionMismatch = false,
  onBack,
  onNext,
  isTextarea = false,
}: NavigationControlsProps) {
  const isIntro = currentStep === 0;
  const isLast = currentStep === totalSteps;
  const isBusy = isSubmitting || isSavingDraft;

  return (
    <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {!isIntro ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={isBusy}
            className="h-9 px-3 text-xs"
            aria-label="Previous question"
          >
            <IconChevronLeft className="size-3.5 mr-1" />
            Back
          </Button>
        ) : null}

        <Button
          type="button"
          size="sm"
          onClick={onNext}
          disabled={(isLast && isOwner) || isBusy || (isLast && isVersionMismatch)}
          className="h-9 px-4 text-xs font-medium"
        >
          {isLast ? (
            isOwner ? (
              "Preview only"
            ) : isBusy ? (
              <>
                <IconSpinner className="size-3.5 animate-spin mr-1.5" />
                Submitting...
              </>
            ) : (
              "Submit response"
            )
          ) : isIntro ? (
            <>
              Start
              <IconChevronRight className="size-3.5 ml-1" />
            </>
          ) : (
            <>
              OK
              <IconChevronRight className="size-3.5 ml-1" />
            </>
          )}
        </Button>
      </div>

      <div className="hidden items-center gap-2 font-mono text-[10px] text-muted-foreground md:flex">
        {isTextarea ? (
          <span>
            Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">⌘</kbd> +{" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">Enter</kbd> to continue
          </span>
        ) : (
          <span>
            Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">Enter ↵</kbd>
          </span>
        )}
      </div>
    </div>
  );
}
