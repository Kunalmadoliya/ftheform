"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { usePublicForm } from "~/hooks/form/use-public-form";
import { useSubmission } from "~/hooks/form/use-submission";
import { toast } from "sonner";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";
import { authClient } from "~/lib/auth-client";
import { env } from "~/env";
import { Button } from "~/components/ui/button";

import {
  QuestionScreen,
  IntroScreen,
  type FormField,
  getOptions,
} from "~/components/public-form/question-screen";
import { ProgressLine } from "~/components/public-form/progress-line";
import { NavigationControls } from "~/components/public-form/navigation-controls";
import {
  FormNotFoundScreen,
  LoadingScreen,
  SignInRequiredScreen,
  AnonymousOnlyScreen,
  FormClosedScreen,
  SnapshotUnavailableScreen,
  SubmissionCompleteScreen,
  OwnerPreviewBanner,
  RestartVersionDialog,
} from "~/components/public-form/status-screens";

function getFormId(formUrl: string) {
  const match = formUrl.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-/i);
  return match?.[1] ?? "";
}

function getFields(value: unknown): FormField[] {
  if (!Array.isArray(value)) return [];
  return value.filter((field): field is FormField => {
    if (!field || typeof field !== "object") return false;
    const candidate = field as Partial<FormField>;
    return typeof candidate.id === "string" && typeof candidate.type === "string" && typeof candidate.label === "string";
  });
}

function validateField(field: FormField, value: unknown): string | null {
  const options = getOptions(field.config);
  const rawConfig = field.config && typeof field.config === "object" && !Array.isArray(field.config)
    ? (field.config as Record<string, unknown>)
    : {};

  if (field.required) {
    if (field.type === "checkbox") {
      if (value !== true) return "This field is required";
    } else if (field.type === "rating") {
      if (typeof value !== "number" || value < 1) return "Please select a rating";
    } else if (field.type === "number") {
      if (typeof value !== "number" || isNaN(value)) return "This field is required";
    } else if (field.type === "multiselect") {
      if (!Array.isArray(value) || value.length === 0) return "Please select at least one option";
    } else if (field.type === "select") {
      if (typeof value !== "string" || value.trim() === "") return "Please select an option";
    } else {
      if (typeof value !== "string" || value.trim() === "") return "This field is required";
    }
  }

  if (value != null && value !== "") {
    if (field.type === "email" && typeof value === "string" && value.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        return "Please enter a valid email address";
      }
    } else if (field.type === "number" && typeof value === "number" && !isNaN(value)) {
      if (typeof rawConfig.min === "number" && value < rawConfig.min) {
        return `Value must be at least ${rawConfig.min}`;
      }
      if (typeof rawConfig.max === "number" && value > rawConfig.max) {
        return `Value must be at most ${rawConfig.max}`;
      }
    } else if (field.type === "date" && typeof value === "string" && value.trim() !== "") {
      if (typeof rawConfig.minDate === "string" && value < rawConfig.minDate) {
        return `Date must be on or after ${rawConfig.minDate}`;
      }
      if (typeof rawConfig.maxDate === "string" && value > rawConfig.maxDate) {
        return `Date must be on or before ${rawConfig.maxDate}`;
      }
    } else if (field.type === "select" && typeof value === "string" && value.trim() !== "") {
      if (options.length > 0 && !options.includes(value)) {
        return "Selected option is invalid";
      }
    } else if (field.type === "multiselect" && Array.isArray(value) && value.length > 0) {
      if (options.length > 0 && value.some((v) => typeof v !== "string" || !options.includes(v))) {
        return "Selected options contain invalid choices";
      }
    }
  }

  return null;
}

export default function PublicFormPage() {
  const params = useParams<{ formUrl: string }>();
  const formUrl = params.formUrl ?? "";
  const formId = getFormId(formUrl);
  const { form, snapshot, formQuery, snapshotQuery, incrementViewAsync } = usePublicForm(formId);
  const [submissionId, setSubmissionId] = useState<string>();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [interactionError, setInteractionError] = useState("");
  const autosaveTimer = useRef<number | undefined>(undefined);
  const autosaveQueue = useRef<Promise<void>>(Promise.resolve());
  const viewAttemptedFor = useRef("");
  const {
    startSubmissionAsync,
    updateDraftAnswerAsync,
    submitFormAsync,
    versionQuery,
    isSubmitting,
    isSavingDraft,
    startError,
    submitError,
  } = useSubmission(formId, submissionId);
  const fields = useMemo(() => getFields(snapshot?.fieldsJson), [snapshot?.fieldsJson]);
  const saveDraft = useCallback((draftAnswer: Record<string, unknown>) => {
    if (!submissionId) return Promise.resolve();
    const queuedSave = autosaveQueue.current.then(async () => {
      await updateDraftAnswerAsync({ submissionId, draftAnswer });
    });
    autosaveQueue.current = queuedSave.catch(() => undefined);
    return queuedSave;
  }, [submissionId, updateDraftAnswerAsync]);

  useEffect(() => {
    if (!formId || !form || viewAttemptedFor.current === formId) return;
    viewAttemptedFor.current = formId;
    void incrementViewAsync({ formId }).catch(() => {
      toast.error("Unable to record this form view.");
    });
  }, [form, formId, incrementViewAsync]);

  useEffect(() => {
    if (!formId || !form || form.isOwner || submissionId) return;
    const startOrResume = () => startSubmissionAsync({ formId });
    const startRequest = async () => (
      navigator.locks
        ? await navigator.locks.request(`ftheform:submission:${formId}`, startOrResume)
        : await startOrResume()
    );
    void startRequest()
      .then((result) => {
        if (result.status === "already_submitted") {
          setAlreadySubmitted(true);
          setSubmitted(true);
          return;
        }
        setSubmissionId(result.id);
        if (result.status === "submitted") {
          setSubmitted(true);
          return;
        }
        if (result.draftAnswer && typeof result.draftAnswer === "object" && !Array.isArray(result.draftAnswer)) {
          setAnswers(result.draftAnswer as Record<string, unknown>);
        }
        setInteractionError("");
      })
      .catch((error: unknown) => {
        setInteractionError(getTrpcErrorMessage(error, "Unable to start this response."));
      });
  }, [form, formId, startSubmissionAsync, submissionId]);

  useEffect(() => {
    if (!submissionId || submitted) return;
    const timer = window.setTimeout(() => {
      autosaveTimer.current = undefined;
      void saveDraft(answers).catch((error: unknown) => {
        setInteractionError(getTrpcErrorMessage(error, "Unable to save your progress."));
      });
    }, 500);
    autosaveTimer.current = timer;
    return () => {
      window.clearTimeout(timer);
      if (autosaveTimer.current === timer) autosaveTimer.current = undefined;
    };
  }, [answers, submissionId, submitted, saveDraft]);

  useEffect(() => {
    if (!submissionId || submitted || form?.isOwner) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      if (autosaveTimer.current !== undefined) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = undefined;
      }

      const sendDraftBeacon = () => {
        const endpoint = `${env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")}/submission.updateDraftAnswer`;
        const body = new Blob(
          [JSON.stringify({ json: { submissionId, draftAnswer: answers } })],
          { type: "application/json" },
        );
        if (!navigator.sendBeacon(endpoint, body)) {
          void saveDraft(answers).catch((error: unknown) => {
            setInteractionError(getTrpcErrorMessage(error, "Unable to save your progress."));
          });
        }
      };
      void autosaveQueue.current.then(sendDraftBeacon, sendDraftBeacon);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [answers, form?.isOwner, saveDraft, submissionId, submitted]);

  function updateAnswer(fieldId: string, value: unknown) {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
  }

  function restartAfterVersionChange() {
    setSubmissionId(undefined);
    setAnswers({});
    setInteractionError("");
  }

  // Stepper and validation state
  const [currentStep, setCurrentStep] = useState(0);
  const [stepDirection, setStepDirection] = useState<"forward" | "backward">("forward");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);

  // When a saved draft is restored, start at the first unanswered required question, or at the first question if none
  const hasRestoredStepRef = useRef(false);
  useEffect(() => {
    if (!submissionId || hasRestoredStepRef.current || fields.length === 0) return;
    const hasAnyDraftAnswer = Object.keys(answers).length > 0;
    if (!hasAnyDraftAnswer) return;

    hasRestoredStepRef.current = true;
    const firstUnansweredIndex = fields.findIndex((field) => {
      if (!field.required) return false;
      return validateField(field, answers[field.id]) !== null;
    });

    if (firstUnansweredIndex !== -1) {
      setCurrentStep(firstUnansweredIndex + 1);
    } else {
      setCurrentStep(1);
    }
  }, [answers, fields, submissionId]);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    if (!submissionId) return;

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]!;
      const err = validateField(field, answers[field.id]);
      if (err) {
        setFieldErrors((prev) => ({ ...prev, [field.id]: err }));
        setStepDirection("forward");
        setCurrentStep(i + 1);
        setInteractionError(err);
        return;
      }
    }

    const missingRating = fields.some(
      (field) => {
        const value = answers[field.id];
        return field.type === "rating" && field.required &&
          (typeof value !== "number" || value < 1);
      },
    );
    if (missingRating) {
      setInteractionError("Please complete the required rating fields.");
      return;
    }
    if (autosaveTimer.current !== undefined) {
      window.clearTimeout(autosaveTimer.current);
      autosaveTimer.current = undefined;
    }
    setInteractionError("");
    try {
      await saveDraft(answers);
      const result = await submitFormAsync({ submissionId });
      setAlreadySubmitted(result.id !== submissionId);
      setSubmitted(true);
    } catch (error) {
      setInteractionError(getTrpcErrorMessage(error, "Unable to submit this response."));
    }
  }

  const handleNextOrSubmit = useCallback(() => {
    if (currentStep === 0) {
      if (fields.length === 0) return;
      setStepDirection("forward");
      setCurrentStep(1);
      return;
    }

    const currentFieldIndex = currentStep - 1;
    const currentField = fields[currentFieldIndex];
    if (!currentField) return;

    const error = validateField(currentField, answers[currentField.id]);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [currentField.id]: error }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, [currentField.id]: null }));

    if (currentStep < fields.length) {
      setStepDirection("forward");
      setCurrentStep((prev) => prev + 1);
    } else {
      void handleSubmit();
    }
  }, [answers, currentStep, fields]);

  const handlePrevStep = useCallback(() => {
    if (currentStep <= 0) return;
    setStepDirection("backward");
    setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  // Global keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (restartDialogOpen) return;
      const target = event.target as HTMLElement | null;
      const isInput = target?.tagName === "INPUT";
      const isTextarea = target?.tagName === "TEXTAREA";

      if (event.key === "ArrowUp") {
        if (!isInput && !isTextarea && currentStep > 0) {
          event.preventDefault();
          handlePrevStep();
        }
        return;
      }

      if (event.key === "Enter") {
        if (isTextarea) {
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            handleNextOrSubmit();
          }
        } else {
          event.preventDefault();
          handleNextOrSubmit();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, handleNextOrSubmit, handlePrevStep, restartDialogOpen]);

  if (!formId) return <FormNotFoundScreen />;
  if (formQuery.isPending) return <LoadingScreen />;
  if (formQuery.error?.data?.code === "UNAUTHORIZED") {
    return <SignInRequiredScreen formUrl={formUrl} />;
  }
  if (formQuery.error?.data?.code === "FORBIDDEN") {
    return (
      <AnonymousOnlyScreen
        onSignOut={async () => {
          try {
            await authClient.signOut();
            await formQuery.refetch();
          } catch (error) {
            toast.error(getTrpcErrorMessage(error, "Unable to sign out."));
          }
        }}
      />
    );
  }
  if (formQuery.isError || !form) return <FormNotFoundScreen />;
  if (!form.acceptingResponses && !form.isOwner) {
    return <FormClosedScreen isLimit={form.isPublished && form.isOpen} />;
  }
  if (snapshotQuery.isPending) return <LoadingScreen />;
  if (snapshotQuery.isError || !snapshot) return <SnapshotUnavailableScreen />;
  if (submitted) {
    return <SubmissionCompleteScreen alreadySubmitted={alreadySubmitted} />;
  }

  const currentField = currentStep > 0 ? fields[currentStep - 1] : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {form.isOwner ? <OwnerPreviewBanner /> : null}

      {/* Top Bar with Form Title and Progress Line */}
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/95 backdrop-blur-sm px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xs font-medium text-muted-foreground">{form.title}</h2>
          </div>
          {currentStep > 0 ? (
            <div className="w-48 sm:w-60">
              <ProgressLine
                current={currentStep}
                total={fields.length}
                isSavingDraft={isSavingDraft}
              />
            </div>
          ) : null}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12 sm:px-8">
        <form onSubmit={(e) => void handleSubmit(e)} className="w-full">
          {currentStep === 0 ? (
            <IntroScreen
              title={form.title}
              description={form.description}
              totalQuestions={fields.length}
              onStart={handleNextOrSubmit}
            />
          ) : currentField ? (
            <QuestionScreen
              key={currentStep}
              field={currentField}
              index={currentStep}
              total={fields.length}
              value={answers[currentField.id]}
              error={fieldErrors[currentField.id]}
              direction={stepDirection}
              disabled={form.isOwner}
              onChange={(value) => {
                updateAnswer(currentField.id, value);
                if (fieldErrors[currentField.id]) {
                  setFieldErrors((prev) => ({ ...prev, [currentField.id]: null }));
                }
              }}
            />
          ) : null}

          {interactionError || startError || submitError || versionQuery.error || versionQuery.data?.mismatch ? (
            <div className="mt-4 rounded-[var(--radius)] border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-destructive" role="alert">
                {interactionError ||
                  (versionQuery.data?.mismatch
                    ? "This form has changed. Reload it before submitting."
                    : "Unable to submit this response.")}
              </p>
              {versionQuery.data?.mismatch ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => setRestartDialogOpen(true)}
                >
                  Start a new response
                </Button>
              ) : null}
            </div>
          ) : null}

          <NavigationControls
            currentStep={currentStep}
            totalSteps={fields.length}
            isOwner={form.isOwner}
            isSubmitting={isSubmitting}
            isSavingDraft={isSavingDraft}
            isVersionMismatch={Boolean(versionQuery.data?.mismatch)}
            onBack={handlePrevStep}
            onNext={handleNextOrSubmit}
            isTextarea={currentField?.type === "textarea"}
          />
        </form>
      </main>

      <RestartVersionDialog
        open={restartDialogOpen}
        onOpenChange={setRestartDialogOpen}
        onConfirm={restartAfterVersionChange}
      />
    </div>
  );
}
