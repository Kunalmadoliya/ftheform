"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BuilderHeader } from "~/components/builder/builder-header";
import { FieldInspector } from "~/components/builder/field-inspector";
import { FieldTypePalette, fieldTypes } from "~/components/builder/field-type-palette";
import type { FieldTypeDefinition } from "~/components/builder/field-type-item";
import { FormCanvas, type BuilderField } from "~/components/builder/form-canvas";
import { FormSettingsBar } from "~/components/builder/form-settings-bar";
import { useForm, useFormById } from "~/hooks/form/use-form";
import { useFormFields } from "~/hooks/form/use-form-fields";
import { authClient } from "~/lib/auth-client";

type BuilderPageProps = { formId: string };

export function BuilderPage({ formId }: BuilderPageProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const formQuery = useFormById(formId, !isSessionPending && Boolean(session?.user));
  const { renameFormAsync } = useForm();
  const { fields, fieldsQuery, createFieldAsync, updateFieldAsync, deleteFieldAsync } = useFormFields(formId);
  const [title, setTitle] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState<string>();
  const form = formQuery.data;
  const displayTitle = title || form?.title || "Untitled form";
  const selectedField = fields.find((field) => field.id === selectedFieldId) as BuilderField | undefined;

  useEffect(() => {
    if (!isSessionPending && !session?.user) router.replace("/login");
  }, [isSessionPending, router, session]);

  async function saveTitle() {
    if (title.trim() && title !== form?.title) await renameFormAsync({ formId, title: title.trim() });
  }
  async function addField(definition: FieldTypeDefinition) {
    const field = await createFieldAsync({ formId, type: definition.type, category: "input", label: definition.label, required: false });
    setSelectedFieldId(field.id);
  }
  async function saveField(updates: { label: string; required: boolean }) {
    if (!selectedField) return;
    await updateFieldAsync({ formId, formFieldId: selectedField.id, label: updates.label, required: updates.required });
  }
  async function deleteSelectedField() {
    if (!selectedField) return;
    await deleteFieldAsync({ formId, formFieldId: selectedField.id });
    setSelectedFieldId(undefined);
  }

  if (!isSessionPending && !session?.user) return null;
  if (formQuery.isError) return <div className="p-8"><p className="text-sm text-destructive">Unable to load this form.</p><button className="mt-4 text-sm underline" onClick={() => router.push("/dashboard")}>Back to dashboard</button></div>;
  if (isSessionPending || formQuery.isPending || !form) return <div className="p-8 text-sm text-muted-foreground">Loading form...</div>;

  return <div className="flex min-h-screen flex-col bg-background"><BuilderHeader title={displayTitle} onTitleChange={setTitle} onTitleSave={() => void saveTitle()} /><FormSettingsBar isPublished={form.isPublished} responseLimit={50} /><div className="flex min-h-0 flex-1 flex-col lg:flex-row"><FieldTypePalette onAdd={(definition) => void addField(definition)} /><FormCanvas fields={fields as BuilderField[]} selectedFieldId={selectedFieldId} onSelect={(field) => setSelectedFieldId(field.id)} onAdd={() => void addField(fieldTypes[0]!)} /><FieldInspector field={selectedField} onSave={saveField} onDelete={deleteSelectedField} /></div>{fieldsQuery.isFetching ? <p className="fixed bottom-4 right-4 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">Saving...</p> : null}</div>;
}