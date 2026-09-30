"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { usePublicForm } from "~/hooks/form/use-public-form";
import { useSubmission } from "~/hooks/form/use-submission";

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
  const { startSubmissionAsync, updateDraftAnswerAsync, submitFormAsync, versionQuery, isSubmitting, startError, submitError } = useSubmission(formId, submissionId);
  const fields = useMemo(() => getFields(snapshot?.fieldsJson), [snapshot?.fieldsJson]);

  useEffect(() => {
    if (!formId || !form) return;
    const viewKey = `form-viewed:${formId}`;
    if (window.localStorage.getItem(viewKey)) return;
    window.localStorage.setItem(viewKey, "1");
    void incrementViewAsync({ formId }).catch(() => window.localStorage.removeItem(viewKey));
  }, [form, formId, incrementViewAsync]);

  useEffect(() => {
    if (!formId || !form || submissionId) return;
    const storageKey = `form-submission:${formId}`;
    const storedId = window.localStorage.getItem(storageKey) ?? undefined;
    void startSubmissionAsync({ formId, submissionId: storedId }).then((submission) => {
      setSubmissionId(submission.id);
      window.localStorage.setItem(storageKey, submission.id);
      if (submission.draftAnswer && typeof submission.draftAnswer === "object" && !Array.isArray(submission.draftAnswer)) {
        setAnswers(submission.draftAnswer as Record<string, unknown>);
      }
    });
  }, [form, formId, startSubmissionAsync, submissionId]);

  useEffect(() => {
    if (!submissionId || submitted) return;
    const timer = window.setTimeout(() => {
      void updateDraftAnswerAsync({ submissionId, draftAnswer: answers });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [answers, submissionId, submitted, updateDraftAnswerAsync]);

  function updateAnswer(fieldId: string, value: unknown) {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!submissionId) return;
    await updateDraftAnswerAsync({ submissionId, draftAnswer: answers });
    await submitFormAsync({ submissionId });
    setSubmitted(true);
    window.localStorage.removeItem(`form-submission:${formId}`);
  }

  if (!formId) return <main className="mx-auto max-w-2xl p-8"><h1 className="text-xl font-semibold">Form not found</h1></main>;
  if (formQuery.isPending || snapshotQuery.isPending) return <main className="mx-auto max-w-2xl p-8 text-sm text-muted-foreground">Loading form...</main>;
  if (formQuery.isError || !form) return <main className="mx-auto max-w-2xl p-8"><h1 className="text-xl font-semibold">Form not found</h1></main>;
  if (!form.isOpen) return <main className="mx-auto max-w-2xl p-8"><h1 className="text-xl font-semibold">This form is closed</h1></main>;
  if (snapshotQuery.isError || !snapshot) return <main className="mx-auto max-w-2xl p-8"><h1 className="text-xl font-semibold">This form is unavailable</h1></main>;
  if (submitted) return <main className="mx-auto max-w-2xl p-8"><h1 className="text-xl font-semibold">Response submitted</h1><p className="mt-2 text-muted-foreground">Thank you for your response.</p></main>;

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
          const inputType = field.type === "email" || field.type === "number" || field.type === "date" ? field.type : "text";
          return <label className="block space-y-2" key={field.id}><span className="text-sm font-medium">{field.label}{field.required ? " *" : ""}</span><Input type={inputType} required={field.required} value={value == null ? "" : String(value)} onChange={(event) => updateAnswer(field.id, inputType === "number" ? Number(event.target.value) : event.target.value)} /></label>;
        })}
        {startError || submitError || versionQuery.error ? <p className="text-sm text-destructive" role="alert">Unable to submit this response.</p> : null}
        <Button type="submit" disabled={!submissionId || isSubmitting}>{isSubmitting ? "Submitting..." : "Submit response"}</Button>
      </form>
    </main>
  );
}
