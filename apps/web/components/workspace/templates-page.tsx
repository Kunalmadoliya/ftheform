"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCreate, IconSpinner } from "~/components/icons/app-icons";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useForm } from "~/hooks/form/use-form";
import { trpc } from "~/trpc/client";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";

type TemplateField = {
  type: string;
  label: string;
  required?: boolean;
  config?: Record<string, unknown>;
};
type FormTemplate = {
  id: string;
  title: string;
  description: string;
  fields: TemplateField[];
};

const templates: FormTemplate[] = [
  {
    id: "job-application",
    title: "Job application",
    description: "Collect candidate contact details, experience, and availability.",
    fields: [
      { type: "text", label: "Full name", required: true },
      { type: "email", label: "Email address", required: true },
      { type: "textarea", label: "Relevant experience", required: true },
      { type: "date", label: "Earliest start date" },
    ],
  },
  {
    id: "contact",
    title: "Contact form",
    description: "A simple way for visitors to get in touch.",
    fields: [
      { type: "text", label: "Name", required: true },
      { type: "email", label: "Email", required: true },
      { type: "select", label: "Reason for contacting", config: { options: ["General question", "Support", "Partnership"] } },
      { type: "textarea", label: "Message", required: true },
    ],
  },
  {
    id: "feedback-survey",
    title: "Feedback survey",
    description: "Gather useful feedback about an experience.",
    fields: [
      { type: "rating", label: "Overall experience", required: true, config: { maxStars: 5 } },
      { type: "select", label: "What went well?", config: { options: ["Ease of use", "Support", "Value", "Other"] } },
      { type: "textarea", label: "What could we improve?" },
    ],
  },
  {
    id: "event-registration",
    title: "Event registration",
    description: "Register attendees and capture session preferences.",
    fields: [
      { type: "text", label: "Attendee name", required: true },
      { type: "email", label: "Email address", required: true },
      { type: "select", label: "Ticket type", required: true, config: { options: ["General", "Student", "VIP"] } },
      { type: "multiselect", label: "Sessions", config: { options: ["Morning", "Afternoon", "Networking"] } },
    ],
  },
  {
    id: "customer-satisfaction",
    title: "Customer satisfaction",
    description: "Understand how customers feel about your service.",
    fields: [
      { type: "rating", label: "Satisfaction", required: true, config: { maxStars: 5 } },
      { type: "select", label: "How often do you use us?", config: { options: ["Daily", "Weekly", "Monthly", "Rarely"] } },
      { type: "textarea", label: "Tell us more" },
    ],
  },
  {
    id: "bug-report",
    title: "Bug report",
    description: "Collect the details needed to reproduce an issue.",
    fields: [
      { type: "text", label: "Issue summary", required: true },
      { type: "select", label: "Severity", required: true, config: { options: ["Low", "Medium", "High", "Critical"] } },
      { type: "textarea", label: "Steps to reproduce", required: true },
      { type: "text", label: "Browser or device" },
    ],
  },
  {
    id: "nps-survey",
    title: "NPS survey",
    description: "Measure how likely customers are to recommend you.",
    fields: [
      { type: "select", label: "How likely are you to recommend us?", required: true, config: { options: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] } },
      { type: "textarea", label: "What is the main reason for your score?" },
    ],
  },
  {
    id: "quiz",
    title: "Quiz",
    description: "Build a short knowledge check with choice questions.",
    fields: [
      { type: "text", label: "Participant name", required: true },
      { type: "select", label: "Question 1", required: true, config: { options: ["Answer A", "Answer B", "Answer C"] } },
      { type: "select", label: "Question 2", required: true, config: { options: ["Answer A", "Answer B", "Answer C"] } },
    ],
  },
];

export function TemplatesPage() {
  const router = useRouter();
  const { createFormAsync } = useForm();
  const createField = trpc.formField.createFormField.useMutation();
  const [creatingTemplateId, setCreatingTemplateId] = useState<string>();
  const [createdFormId, setCreatedFormId] = useState<string>();
  const [error, setError] = useState("");

  async function useTemplate(template: FormTemplate) {
    setCreatingTemplateId(template.id);
    setCreatedFormId(undefined);
    setError("");
    try {
      const form = await createFormAsync({ title: template.title });
      setCreatedFormId(form.id);
      for (const field of template.fields) {
        await createField.mutateAsync({
          formId: form.id,
          type: field.type,
          category: "input",
          label: field.label,
          required: field.required ?? false,
          config: field.config,
        });
      }
      router.push(`/forms/${form.id}/builder`);
    } catch (creationError) {
      setError(getTrpcErrorMessage(creationError, "Unable to create this template."));
    } finally {
      setCreatingTemplateId(undefined);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Presets</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Templates</h1>
        <p className="mt-1 text-xs text-muted-foreground">Start with a pre-configured form structure and customize it.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 font-mono text-xs text-destructive" role="alert">
          <p>{error}</p>
          {createdFormId ? (
            <Button
              variant="link"
              className="mt-2 h-auto p-0 font-mono text-xs text-foreground underline underline-offset-4"
              onClick={() => router.push(`/forms/${createdFormId}/builder`)}
            >
              Open the partially created form
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const isCreating = creatingTemplateId === template.id;
          return (
            <Card key={template.id} className="flex flex-col rounded-2xl border-border bg-card shadow-none">
              <CardHeader className="p-6">
                <CardTitle className="text-base font-semibold text-foreground">{template.title}</CardTitle>
                <CardDescription className="mt-1 font-mono text-xs text-muted-foreground">{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4 p-6 pt-0">
                <div className="flex items-center justify-between border-t border-border pt-4 font-mono text-xs text-muted-foreground">
                  <span>{template.fields.length} typed fields</span>
                </div>
                <Button
                  className="w-full gap-2 font-mono text-xs"
                  size="sm"
                  disabled={Boolean(creatingTemplateId)}
                  onClick={() => void useTemplate(template)}
                >
                  {isCreating ? (
                    <IconSpinner className="size-3.5 animate-spin" />
                  ) : (
                    <IconCreate className="size-3.5" />
                  )}
                  {isCreating ? "Creating..." : "Use template"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
