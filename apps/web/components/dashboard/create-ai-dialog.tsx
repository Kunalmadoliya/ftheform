"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useAiGeneration } from "~/components/builder/use-ai-generation";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";

type CreateAiDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: string;
  createFormAsync: (input: { title: string }) => Promise<{ id: string; title: string }>;
};

export function CreateAiDialog({
  open,
  onOpenChange,
  initialPrompt = "",
  createFormAsync,
}: CreateAiDialogProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isCreating, setIsCreating] = useState(false);
  const [createdFormId, setCreatedFormId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const isSubmittingRef = useRef(false);

  const {
    startGeneration,
    isGenerating,
    status,
    statusError,
    reset,
  } = useAiGeneration({
    formId: createdFormId ?? undefined,
    onCompleted: () => {
      if (createdFormId) {
        toast.success("Form generated successfully.");
        onOpenChange(false);
        router.push(`/forms/${createdFormId}/builder`);
      }
    },
    onFailed: (err) => {
      if (createdFormId) {
        toast.error(err || "AI generation failed. You can retry from the builder dock.");
        onOpenChange(false);
        router.push(`/forms/${createdFormId}/builder`);
      }
    },
    onTimedOut: () => {
      if (createdFormId) {
        toast.warning("Generation is taking longer than expected.");
        onOpenChange(false);
        router.push(`/forms/${createdFormId}/builder`);
      }
    },
  });

  // Sync initialPrompt when dialog opens
  useEffect(() => {
    if (open) {
      if (initialPrompt) setPrompt(initialPrompt);
      setSubmitError("");
      setIsCreating(false);
      setCreatedFormId(null);
      isSubmittingRef.current = false;
      reset();
    }
  }, [initialPrompt, open]);

  const trimmedLength = prompt.trim().length;
  const isValidLength = trimmedLength >= 8 && trimmedLength <= 2000;
  // Busy from moment creation starts until terminal outcome
  const isBusy = isCreating || Boolean(createdFormId) || isGenerating;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidLength || isBusy || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setSubmitError("");
    setIsCreating(true);

    const cleanPrompt = prompt.trim();
    const sensibleTitle =
      cleanPrompt.length > 40
        ? `${cleanPrompt.slice(0, 40).trim()}...`
        : cleanPrompt || "AI generated form";

    let targetFormId: string | null = null;
    try {
      const newForm = await createFormAsync({ title: sensibleTitle });
      targetFormId = newForm.id;
      setCreatedFormId(newForm.id);
      setIsCreating(false);

      await startGeneration({
        formId: newForm.id,
        prompt: cleanPrompt,
      });
    } catch (error) {
      setIsCreating(false);
      const message = getTrpcErrorMessage(error, "Unable to create or generate form.");
      setSubmitError(message);
      // If the form was already created but generation start failed, still navigate so user isn't stuck
      if (targetFormId) {
        toast.error(message);
        onOpenChange(false);
        router.push(`/forms/${targetFormId}/builder`);
      } else {
        isSubmittingRef.current = false;
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isBusy) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (isBusy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isBusy) e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-[var(--radius)] border border-border bg-muted">
              <Sparkles className="size-3.5 text-foreground" />
            </span>
            <DialogTitle>Create with AI</DialogTitle>
          </div>
          <DialogDescription>
            Describe what you need. AI will create your form and generate the initial fields.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-prompt" className="text-xs font-medium">
                Prompt
              </Label>
              <span
                className={`font-mono text-[10px] ${
                  trimmedLength > 2000
                    ? "text-destructive"
                    : trimmedLength < 8 && trimmedLength > 0
                      ? "text-muted-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {trimmedLength} / 2000
              </span>
            </div>
            <Textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g. A post-event feedback survey with rating scale, key takeaways, and speaker evaluation..."
              className="min-h-28 resize-none text-xs leading-relaxed"
              disabled={isBusy}
              autoFocus
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Minimum 8 characters. You can refine and add more questions in the builder.
            </p>
          </div>

          {submitError || statusError ? (
            <p className="text-xs text-destructive" role="alert">
              {submitError || statusError}
            </p>
          ) : null}

          {isBusy ? (
            <div className="flex items-center gap-2.5 rounded-[var(--radius)] border border-border/80 bg-muted/40 p-3 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-foreground shrink-0" />
              <span>
                {isCreating
                  ? "Initializing form..."
                  : status === "running"
                    ? "Generating fields with AI..."
                    : "Cooking your form..."}
              </span>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValidLength || isBusy}
            >
              {isBusy ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  Generate form
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
