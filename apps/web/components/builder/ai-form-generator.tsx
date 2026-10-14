"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { trpc } from "~/trpc/client";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";

type AiFormGeneratorProps = { formId: string };

export function AiFormGenerator({ formId }: AiFormGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [jobId, setJobId] = useState<string>();
  const [requestError, setRequestError] = useState("");
  const completedJobId = useRef<string | undefined>(undefined);
  const pollingStartedAt = useRef<number | undefined>(undefined);
  const utils = trpc.useUtils();
  const startGeneration = trpc.formAi.startGeneration.useMutation();
  const statusQuery = trpc.formAi.getGenerationStatus.useQuery(
    { jobId: jobId ?? "" },
    {
      enabled: Boolean(jobId),
      retry: 2,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        const timedOut = pollingStartedAt.current !== undefined &&
          Date.now() - pollingStartedAt.current >= 10 * 60 * 1000;
        return (status === "pending" || status === "running") && !timedOut ? 1500 : false;
      },
    },
  );
  const status = statusQuery.data?.status;
  const hasActiveJob = status === "pending" || status === "running";
  const pollingTimedOut = hasActiveJob && pollingStartedAt.current !== undefined &&
    Date.now() - pollingStartedAt.current >= 10 * 60 * 1000;
  const isGenerating = startGeneration.isPending || (hasActiveJob && !pollingTimedOut);

  useEffect(() => {
    if (status !== "completed" || !jobId || completedJobId.current === jobId) return;
    completedJobId.current = jobId;
    void utils.formField.listFormFields.invalidate({ formId });
    void utils.form.getFormById.invalidate({ formId });
    toast.success("Your generated fields are ready.");
  }, [formId, jobId, status, utils]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError("");
    try {
      const job = await startGeneration.mutateAsync({ formId, prompt });
      pollingStartedAt.current = Date.now();
      setJobId(job.id);
    } catch (error) {
      setRequestError(getTrpcErrorMessage(error, "Unable to start form generation."));
    }
  }

  return (
    <section className="space-y-3 border-b p-5" aria-labelledby="ai-form-title">
      <div>
        <h2 id="ai-form-title" className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" />
          Generate with AI
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Describe the form you want. Generated fields will be added to this form.
        </p>
      </div>
      <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          minLength={8}
          maxLength={2000}
          required
          disabled={isGenerating || hasActiveJob}
          aria-label="Describe the form to generate"
          placeholder="Create a customer feedback form for an online store..."
          className="min-h-24 resize-y text-sm"
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isGenerating || hasActiveJob || prompt.trim().length < 8}
        >
          {isGenerating ? (
            <>
              <LoaderCircle className="animate-spin" />
              Cooking your form...
            </>
          ) : (
            <>
              <Sparkles />
              {status === "failed" ? "Try again" : "Generate fields"}
            </>
          )}
        </Button>
      </form>
      {requestError ? (
        <p className="text-xs text-destructive" role="alert">{requestError}</p>
      ) : null}
      {status === "pending" || status === "running" ? (
        <p className="text-xs text-muted-foreground" role="status">
          {pollingTimedOut
            ? "Status polling stopped after 10 minutes. Check the job status manually."
            : "Cooking your form... This may take a little while."}
        </p>
      ) : null}
      {pollingTimedOut ? (
        <Button type="button" variant="outline" onClick={() => void statusQuery.refetch()}>
          Check status
        </Button>
      ) : null}
      {statusQuery.isError ? (
        <div className="space-y-1 text-xs text-destructive" role="alert">
          <p>Unable to check generation status.</p>
          <button type="button" className="underline" onClick={() => void statusQuery.refetch()}>
            Check again
          </button>
        </div>
      ) : null}
      {status === "failed" ? (
        <p className="text-xs text-destructive" role="alert">
          {statusQuery.data?.error ?? "Generation failed. You can safely try again."}
        </p>
      ) : null}
    </section>
  );
}
