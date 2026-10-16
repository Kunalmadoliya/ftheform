"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "~/trpc/client";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";

type UseAiGenerationOptions = {
  formId?: string;
  onCompleted?: (jobId: string) => void;
  onFailed?: (error?: string | null) => void;
  onTimedOut?: () => void;
};

export function useAiGeneration(options: UseAiGenerationOptions = {}) {
  const { formId: initialFormId, onCompleted, onFailed, onTimedOut } = options;
  const [formId, setFormId] = useState<string | undefined>(initialFormId);
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [requestError, setRequestError] = useState<string>("");
  const [pollingTimedOut, setPollingTimedOut] = useState<boolean>(false);
  const completedJobId = useRef<string | undefined>(undefined);
  const failedJobId = useRef<string | undefined>(undefined);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const utils = trpc.useUtils();

  // Keep internal formId in sync if initialFormId changes
  useEffect(() => {
    if (initialFormId) {
      setFormId(initialFormId);
    }
  }, [initialFormId]);

  // Clear timeout timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
      }
    };
  }, []);

  const startGenerationMutation = trpc.formAi.startGeneration.useMutation();

  const statusQuery = trpc.formAi.getGenerationStatus.useQuery(
    { jobId: jobId ?? "" },
    {
      enabled: Boolean(jobId),
      retry: 2,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return (status === "pending" || status === "running") && !pollingTimedOut ? 1500 : false;
      },
    },
  );

  const status = statusQuery.data?.status;
  const hasActiveJob = status === "pending" || status === "running";
  const isGenerating = startGenerationMutation.isPending || (hasActiveJob && !pollingTimedOut);

  // Invalidate queries and trigger callbacks on completion
  useEffect(() => {
    if (status !== "completed" || !jobId || completedJobId.current === jobId) return;
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = undefined;
    }
    completedJobId.current = jobId;
    if (formId) {
      void utils.formField.listFormFields.invalidate({ formId });
      void utils.form.getFormById.invalidate({ formId });
    }
    onCompleted?.(jobId);
  }, [formId, jobId, onCompleted, status, utils]);

  // Trigger callback on failure
  useEffect(() => {
    if (status !== "failed" || !jobId || failedJobId.current === jobId) return;
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = undefined;
    }
    failedJobId.current = jobId;
    onFailed?.(statusQuery.data?.error);
  }, [jobId, onFailed, status, statusQuery.data?.error]);

  // Trigger callback on polling timeout
  useEffect(() => {
    if (!pollingTimedOut) return;
    onTimedOut?.();
  }, [onTimedOut, pollingTimedOut]);

  async function startGeneration({
    formId: targetFormId,
    prompt,
  }: {
    formId: string;
    prompt: string;
  }) {
    setRequestError("");
    setPollingTimedOut(false);
    setFormId(targetFormId);
    completedJobId.current = undefined;
    failedJobId.current = undefined;

    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
    }
    // 10-minute timeout
    timeoutTimerRef.current = setTimeout(() => {
      setPollingTimedOut(true);
    }, 10 * 60 * 1000);

    try {
      const job = await startGenerationMutation.mutateAsync({
        formId: targetFormId,
        prompt,
      });
      setJobId(job.id);
      return job;
    } catch (error) {
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = undefined;
      }
      const message = getTrpcErrorMessage(error, "Unable to start form generation.");
      setRequestError(message);
      throw error;
    }
  }

  function reset() {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = undefined;
    }
    setJobId(undefined);
    setRequestError("");
    setPollingTimedOut(false);
    completedJobId.current = undefined;
    failedJobId.current = undefined;
  }

  return {
    startGeneration,
    jobId,
    status,
    statusError: statusQuery.data?.error,
    requestError,
    isGenerating,
    hasActiveJob,
    pollingTimedOut,
    refetchStatus: () => statusQuery.refetch(),
    reset,
  };
}
