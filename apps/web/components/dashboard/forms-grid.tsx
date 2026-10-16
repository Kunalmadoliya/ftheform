"use client";

import { FileText, Plus, Sparkles } from "lucide-react";
import { FormCard, type FormSummary } from "~/components/dashboard/form-card";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

type FormsGridProps = {
  forms: FormSummary[];
  isLoading?: boolean;
  onEdit: (form: FormSummary) => void;
  onDelete: (formId: string) => void;
  onArchive: (formId: string) => void;
  onRestore: (formId: string) => void;
  onPublish: (formId: string) => void;
  onUnpublish: (formId: string) => void;
  onCreateForm?: () => void;
  onCreateAi?: () => void;
};

export function FormsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="flex h-full flex-col border-border bg-card p-0 py-0 gap-0">
          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="size-7 rounded-sm" />
            </div>
            <Skeleton className="mt-3 h-5 w-3/4" />
            <Skeleton className="mt-1 h-9 w-full" />
          </div>
          <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-2 border-t border-border/60 px-5 py-4 mt-auto">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="size-8 shrink-0" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function FormsGrid({
  forms,
  isLoading = false,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onPublish,
  onUnpublish,
  onCreateForm,
  onCreateAi,
}: FormsGridProps) {
  if (isLoading) {
    return <FormsGridSkeleton />;
  }

  if (forms.length === 0) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-border/80 bg-card/40 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-[var(--radius)] border border-border bg-muted/60 text-muted-foreground">
          <FileText className="size-5" />
        </div>
        <h3 className="mt-4 text-sm font-semibold tracking-tight text-foreground">
          No forms in this view
        </h3>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          You don&apos;t have any forms here yet. Start fresh with a blank canvas or generate questions
          instantly with AI.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {onCreateForm ? (
            <Button size="sm" onClick={onCreateForm}>
              <Plus className="size-3.5 mr-1.5" />
              Create form
            </Button>
          ) : null}
          {onCreateAi ? (
            <Button size="sm" variant="outline" onClick={onCreateAi}>
              <Sparkles className="size-3.5 mr-1.5" />
              Create with AI
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {forms.map((form) => (
        <FormCard
          key={form.id}
          form={form}
          onEdit={() => onEdit(form)}
          onDelete={() => onDelete(form.id)}
          onArchive={() => onArchive(form.id)}
          onRestore={() => onRestore(form.id)}
          onPublish={() => onPublish(form.id)}
          onUnpublish={() => onUnpublish(form.id)}
        />
      ))}
    </div>
  );
}