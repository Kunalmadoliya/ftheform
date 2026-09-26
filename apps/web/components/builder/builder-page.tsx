"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BuilderHeader } from "~/components/builder/builder-header";
import { FieldInspector } from "~/components/builder/field-inspector";
import { FieldTypePalette, fieldTypes } from "~/components/builder/field-type-palette";
import type { FieldTypeDefinition } from "~/components/builder/field-type-item";
import { FormCanvas, type BuilderField } from "~/components/builder/form-canvas";
import { FormSettingsBar } from "~/components/builder/form-settings-bar";
import { FormPreviewDialog } from "~/components/builder/form-preview-dialog";
import { ShareFormDialog } from "~/components/builder/share-form-dialog";
import { useForm, useFormById } from "~/hooks/form/use-form";
import { useFormFields } from "~/hooks/form/use-form-fields";
import { authClient } from "~/lib/auth-client";

type BuilderPageProps = { formId: string };

export function BuilderPage({ formId }: BuilderPageProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const formQuery = useFormById(formId, !isSessionPending && Boolean(session?.user));
  const { renameFormAsync, updateFormDescriptionAsync, toggleFormOpenStatusAsync, publishFormAsync } = useForm();
  const { fields, fieldsQuery, createFieldAsync, updateFieldAsync, deleteFieldAsync } = useFormFields(formId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [savedTitle, setSavedTitle] = useState("");
  const [savedDescription, setSavedDescription] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string>();
  const form = formQuery.data;
  const displayTitle = title;
  const selectedField = fields.find((field) => field.id === selectedFieldId) as BuilderField | undefined;

  useEffect(() => {
    if (!form) return;
    setTitle(form.title);
    setDescription(form.description ?? "");
    setSavedTitle(form.title);
    setSavedDescription(form.description ?? "");
    setPublishedUrl(form.isPublished ? form.formUrl : null);
  }, [form?.id]);

  useEffect(() => {
    if (!isSessionPending && !session?.user) router.replace("/login");
  }, [isSessionPending, router, session]);

  async function saveTitle() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setTitle(form?.title ?? "Untitled form");
      return;
    }
    if (nextTitle !== savedTitle) {
      await renameFormAsync({ formId, title: nextTitle });
      setSavedTitle(nextTitle);
    }
  }
  async function saveDescription() {
    const nextDescription = description.trim() || null;
    if (nextDescription !== savedDescription) {
      await updateFormDescriptionAsync({ formId, description: nextDescription });
      setSavedDescription(nextDescription ?? "");
    }
  }
  async function handleOpenChange(nextIsOpen: boolean) {
    const previousIsOpen = isOpen;
    setIsOpen(nextIsOpen);
    try {
      await toggleFormOpenStatusAsync({ formId, isOpen: nextIsOpen });
    } catch {
      setIsOpen(previousIsOpen);
    }
  }
  async function publishForm() {
    setIsPublishing(true);
    try {
      const publishedForm = await publishFormAsync({ formId, title: title.trim() || form?.title || "Untitled form" });
      setPublishedUrl(publishedForm.formUrl);
      return publishedForm.formUrl;
    } finally {
      setIsPublishing(false);
    }
  }
  async function handleShare() {
    setShareOpen(true);
    if (!form?.isPublished) await publishForm();
  }
  async function addField(definition: FieldTypeDefinition) {
    const config = definition.type === "select" || definition.type === "multiselect" ? { options: ["Option 1"] } : definition.type === "rating" ? { maxStars: 5 } : {};
    const field = await createFieldAsync({ formId, type: definition.type, category: "input", label: definition.label, required: false, config });
    setSelectedFieldId(field.id);
  }
  async function saveField(updates: { label: string; required: boolean; config: Record<string, unknown> }) {
    if (!selectedField) return;
    await updateFieldAsync({ formId, formFieldId: selectedField.id, label: updates.label, required: updates.required, config: updates.config });
  }
  async function deleteSelectedField() {
    if (!selectedField) return;
    await deleteFieldAsync({ formId, formFieldId: selectedField.id });
    setSelectedFieldId(undefined);
  }
  async function deleteFieldFromCanvas(field: BuilderField) {
    if (!window.confirm(`Delete "${field.label}"? This cannot be undone.`)) return;
    await deleteFieldAsync({ formId, formFieldId: field.id });
    if (selectedFieldId === field.id) setSelectedFieldId(undefined);
  }

  if (!isSessionPending && !session?.user) return null;
  if (formQuery.isError) return <div className="p-8"><p className="text-sm text-destructive">Unable to load this form.</p><button className="mt-4 text-sm underline" onClick={() => router.push("/dashboard")}>Back to dashboard</button></div>;
  if (isSessionPending || formQuery.isPending || !form) return <div className="p-8 text-sm text-muted-foreground">Loading form...</div>;

  return <div className="flex min-h-screen flex-col bg-background"><BuilderHeader title={displayTitle} onTitleChange={setTitle} onTitleSave={() => void saveTitle()} onPreview={() => setPreviewOpen(true)} onShare={() => void handleShare()} /><FormSettingsBar isPublished={form.isPublished || Boolean(publishedUrl)} isOpen={isOpen} responseLimit={50} onOpenChange={(nextIsOpen) => void handleOpenChange(nextIsOpen)} /><div className="flex min-h-0 flex-1 flex-col lg:flex-row"><FieldTypePalette onAdd={(definition) => void addField(definition)} /><FormCanvas fields={fields as BuilderField[]} selectedFieldId={selectedFieldId} title={title} description={description} onTitleChange={setTitle} onTitleSave={() => void saveTitle()} onDescriptionChange={setDescription} onDescriptionSave={() => void saveDescription()} onSelect={(field) => setSelectedFieldId(field.id)} onEdit={(field) => setSelectedFieldId(field.id)} onDelete={(field) => void deleteFieldFromCanvas(field)} onAdd={() => void addField(fieldTypes[0]!)} /><FieldInspector field={selectedField} onSave={saveField} onDelete={deleteSelectedField} /></div>{fieldsQuery.isFetching ? <p className="fixed bottom-4 right-4 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">Saving...</p> : null}<FormPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} title={title} description={description} fields={fields as BuilderField[]} /><ShareFormDialog open={shareOpen} onOpenChange={setShareOpen} formUrl={publishedUrl} isPublished={form.isPublished || Boolean(publishedUrl)} isPublishing={isPublishing} onPublish={publishForm} /></div>;
}