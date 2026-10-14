"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { StarRating } from "~/components/forms/star-rating";
import { usePublicForm } from "~/hooks/form/use-public-form";
import { useSubmission } from "~/hooks/form/use-submission";
import { toast } from "sonner";

type FormField = {
  id: string;
  type: string;
  label: string;
  required: boolean;
  config?: unknown;
};

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

function getOptions(config: unknown) {
  if (!config || typeof config !== "object" || Array.isArray(config)) return [];
  const options = (config as { options?: unknown }).options;
  return Array.isArray(options) ? options.filter((option): option is string => typeof option === "string") : [];
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

  useEffect(() => {
    if (!formId || !form) return;
    const viewKey = `form-viewed:${formId}`;
    if (window.localStorage.getItem(viewKey)) return;
    window.localStorage.setItem(viewKey, "1");
    void incrementViewAsync({ formId }).catch(() => {
      window.localStorage.removeItem(viewKey);
      toast.error("Unable to record this form view.");
    });
  }, [form, formId, incrementViewAsync]);

  useEffect(() => {
    if (!formId || !form || submissionId) return;
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
        setInteractionError(error instanceof Error ? error.message : "Unable to start this response.");
      });
  }, [form, formId, startSubmissionAsync, submissionId]);

  useEffect(() => {
    if (!submissionId || submitted) return;
    const timer = window.setTimeout(() => {
      autosaveTimer.current = undefined;
      void updateDraftAnswerAsync({ submissionId, draftAnswer: answers }).catch((error: unknown) => {
        setInteractionError(error instanceof Error ? error.message : "Unable to save your progress.");
      });
    }, 500);
    autosaveTimer.current = timer;
    return () => {
      window.clearTimeout(timer);
      if (autosaveTimer.current === timer) autosaveTimer.current = undefined;
    };
  }, [answers, submissionId, submitted, updateDraftAnswerAsync]);

  function updateAnswer(fieldId: string, value: unknown) {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
  }

  function restartAfterVersionChange() {
    if (!window.confirm("This form changed. Discard your saved draft and start a new response?")) return;
    setSubmissionId(undefined);
    setAnswers({});
    setInteractionError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!submissionId) return;
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
      await updateDraftAnswerAsync({ submissionId, draftAnswer: answers });
      const result = await submitFormAsync({ submissionId });
      setAlreadySubmitted(result.id !== submissionId);
      setSubmitted(true);
    } catch (error) {
      setInteractionError(error instanceof Error ? error.message : "Unable to submit this response.");
    }
  }

  if (!formId) return <main className="mx-auto max-w-2xl p-8"><h1 className="text-xl font-semibold">Form not found</h1></main>;
  if (formQuery.isPending) return <main className="mx-auto max-w-2xl p-8 text-sm text-muted-foreground">Loading form...</main>;
  if (formQuery.error?.message.includes("Authentication required")) {
    const returnTo = `/form/${encodeURIComponent(formUrl)}`;
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-semibold">Sign in to respond</h1>
        <p className="mt-2 text-muted-foreground">This form requires an authenticated account.</p>
        <Link className="mt-4 inline-block underline" href={`/login?next=${encodeURIComponent(returnTo)}`}>
          Continue to sign in
        </Link>
      </main>
    );
  }
  if (formQuery.error?.message.includes("only accepts anonymous responses")) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-semibold">Anonymous responses only</h1>
        <p className="mt-2 text-muted-foreground">Sign out of your account to respond to this form.</p>
      </main>
    );
  }
  if (formQuery.isError || !form) return <main className="mx-auto max-w-2xl p-8"><h1 className="text-xl font-semibold">Form not found</h1></main>;
  if (!form.isOpen) return <main className="mx-auto max-w-2xl p-8"><h1 className="text-xl font-semibold">This form is closed</h1></main>;
  if (snapshotQuery.isPending) return <main className="mx-auto max-w-2xl p-8 text-sm text-muted-foreground">Loading form...</main>;
  if (snapshotQuery.isError || !snapshot) return <main className="mx-auto max-w-2xl p-8"><h1 className="text-xl font-semibold">This form is unavailable</h1></main>;
  if (submitted) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-semibold">
          {alreadySubmitted ? "You already submitted a response" : "Response submitted"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {alreadySubmitted ? "This form does not allow another response from your recognized identity." : "Thank you for your response."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="border-b pb-6">
        <h1 className="text-3xl font-semibold">{form.title}</h1>
        {form.description ? <p className="mt-3 text-muted-foreground">{form.description}</p> : null}
      </header>
      <form className="mt-8 space-y-6" onSubmit={(event) => void handleSubmit(event)}>
        {fields.map((field) => {
          const value = answers[field.id];
          const options = getOptions(field.config);
          if (field.type === "textarea") {
            return <label className="block space-y-2" key={field.id}><span className="text-sm font-medium">{field.label}{field.required ? " *" : ""}</span><Textarea required={field.required} value={typeof value === "string" ? value : ""} onChange={(event) => updateAnswer(field.id, event.target.value)} /></label>;
          }
          if (field.type === "checkbox") {
            return <label className="flex items-center gap-2 text-sm" key={field.id}><input type="checkbox" checked={value === true} onChange={(event) => updateAnswer(field.id, event.target.checked)} required={field.required} />{field.label}</label>;
          }
          if (field.type === "select" || field.type === "multiselect") {
            return <fieldset className="space-y-2" key={field.id}><legend className="text-sm font-medium">{field.label}{field.required ? " *" : ""}</legend>{options.map((option) => <label className="flex items-center gap-2 text-sm" key={option}><input type={field.type === "select" ? "radio" : "checkbox"} name={field.id} value={option} checked={field.type === "select" ? value === option : Array.isArray(value) && value.includes(option)} onChange={(event) => updateAnswer(field.id, field.type === "select" ? option : event.target.checked ? [...(Array.isArray(value) ? value : []), option] : (Array.isArray(value) ? value : []).filter((item) => item !== option))} required={field.required && field.type === "select"} />{option}</label>)}</fieldset>;
          }
          if (field.type === "rating") {
            const config = field.config && typeof field.config === "object" && !Array.isArray(field.config)
              ? field.config as { maxStars?: unknown }
              : {};
            const maxStars = typeof config.maxStars === "number" ? config.maxStars : 5;
            return (
              <fieldset className="space-y-2" key={field.id}>
                <legend className="text-sm font-medium">{field.label}{field.required ? " *" : ""}</legend>
                <StarRating
                  label={field.label}
                  maxStars={maxStars}
                  value={typeof value === "number" ? value : undefined}
                  onChange={(rating) => updateAnswer(field.id, rating)}
                />
              </fieldset>
            );
          }
          const inputType = field.type === "email" || field.type === "number" || field.type === "date" ? field.type : "text";
          return <label className="block space-y-2" key={field.id}><span className="text-sm font-medium">{field.label}{field.required ? " *" : ""}</span><Input type={inputType} required={field.required} value={value == null ? "" : String(value)} onChange={(event) => updateAnswer(field.id, inputType === "number" && event.target.value !== "" ? Number(event.target.value) : event.target.value)} /></label>;
        })}
        {interactionError || startError || submitError || versionQuery.error || versionQuery.data?.mismatch ? (
          <p className="text-sm text-destructive" role="alert">
            {interactionError || (versionQuery.data?.mismatch ? "This form has changed. Reload it before submitting." : "Unable to submit this response.")}
          </p>
        ) : null}
        {versionQuery.data?.mismatch ? (
          <Button type="button" variant="outline" onClick={restartAfterVersionChange}>
            Start a new response
          </Button>
        ) : null}
        <Button type="submit" disabled={!submissionId || isSubmitting || isSavingDraft || versionQuery.data?.mismatch}>
          {isSubmitting || isSavingDraft ? "Submitting..." : "Submit response"}
        </Button>
      </form>
    </main>
  );
}
