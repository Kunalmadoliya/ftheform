import { FormCard, type FormSummary } from "~/components/dashboard/form-card";

type FormsGridProps = {
  forms: FormSummary[];
  onEdit: (form: FormSummary) => void;
  onDelete: (formId: string) => void;
};

export function FormsGrid({ forms, onEdit, onDelete }: FormsGridProps) {
  if (forms.length === 0) {
    return <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">Your forms will appear here. Create your first form to get started.</div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {forms.map((form) => <FormCard key={form.id} form={form} onEdit={() => onEdit(form)} onDelete={() => onDelete(form.id)} />)}
    </div>
  );
}