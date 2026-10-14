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
import { AiFormGenerator } from "~/components/builder/ai-form-generator";
import { useForm, useFormById } from "~/hooks/form/use-form";
import { useFormFields } from "~/hooks/form/use-form-fields";
import { authClient } from "~/lib/auth-client";
import { toast } from "sonner";
import { useUserRole } from "~/hooks/auth/use-user-role";

type BuilderPageProps = { formId: string };

export function BuilderPage({ formId }: BuilderPageProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const userRoleQuery = useUserRole();
  const formQuery = useFormById(formId, !isSessionPending && Boolean(session?.user));
  const {
    renameFormAsync,
    updateFormDescriptionAsync,
    toggleFormOpenAsync,
    updateResponseLimitAsync,
    publishFormAsync,
  } = useForm();
  const {
    fields,
    fieldsQuery,
    createFieldAsync,
    updateFieldAsync,
    deleteFieldAsync,
    reorderFieldsAsync,
  } = useFormFields(formId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [savedTitle, setSavedTitle] = useState("");
  const [savedDescription, setSavedDescription] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [responseLimit, setResponseLimit] = useState(50);
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
    setIsOpen(form.isOpen);
    setResponseLimit(form.responseLimit);
    setPublishedUrl(form.isPublished ? form.formUrl : null);
  }, [form]);

  useEffect(() => {
    if (!isSessionPending && !session?.user) router.replace("/login");
  }, [isSessionPending, router, session]);

  useEffect(() => {
    if (userRoleQuery.error) {
      toast.error("Unable to verify your role. Response-limit changes are disabled.");
    }
  }, [userRoleQuery.error]);

  async function saveTitle() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setTitle(form?.title ?? "Untitled form");
      return true;
    }
    if (nextTitle !== savedTitle) {
      try {
        await renameFormAsync({ formId, title: nextTitle });
        setSavedTitle(nextTitle);
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save the form title.");
        return false;
      }
    }
    return true;
  }
  async function saveDescription() {
    const nextDescription = description.trim() || null;
    if (nextDescription !== savedDescription) {
      try {
        await updateFormDescriptionAsync({ formId, description: nextDescription });
        setSavedDescription(nextDescription ?? "");
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save the form description.");
        return false;
      }
    }
    return true;
  }
  async function handleOpenChange(nextIsOpen: boolean) {
    const previousIsOpen = isOpen;
    setIsOpen(nextIsOpen);
    try {
      await toggleFormOpenAsync({ formId, isOpen: nextIsOpen });
    } catch (error) {
      setIsOpen(previousIsOpen);
      toast.error(error instanceof Error ? error.message : "Unable to update form availability.");
    }
  }
  async function handleResponseLimitSave(nextResponseLimit: number) {
    try {
      const result = await updateResponseLimitAsync({ formId, responseLimit: nextResponseLimit });
      setResponseLimit(result.responseLimit);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update the response limit.");
    }
  }
  async function publishForm() {
    setIsPublishing(true);
    try {
      if (!(await saveTitle()) || !(await saveDescription())) return null;
      const publishedForm = await publishFormAsync({ formId });
      setPublishedUrl(publishedForm.formUrl);
      return publishedForm.formUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to publish this form.");
      return null;
    } finally {
      setIsPublishing(false);
    }
  }
  async function handleShare() {
    try {
      if (!form?.isPublished && !publishedUrl && !(await publishForm())) return;
      setShareOpen(true);
    } catch {
      return;
    }
  }
  async function addField(definition: FieldTypeDefinition) {
    const config = definition.type === "select" || definition.type === "multiselect" ? { options: ["Option 1"] } : definition.type === "rating" ? { maxStars: 5 } : {};
    try {
      const field = await createFieldAsync({ formId, type: definition.type, category: "input", label: definition.label, required: false, config });
      setSelectedFieldId(field.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add this field.");
    }
  }
  async function saveField(updates: { label: string; required: boolean; config: Record<string, unknown> }) {
    if (!selectedField) return;
    try {
      await updateFieldAsync({ formId, formFieldId: selectedField.id, label: updates.label, required: updates.required, config: updates.config });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save this field.");
    }
  }
  async function deleteSelectedField() {
    if (!selectedField) return;
    try {
      await deleteFieldAsync({ formId, formFieldId: selectedField.id });
      setSelectedFieldId(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete this field.");
    }
  }
  async function deleteFieldFromCanvas(field: BuilderField) {
    if (!window.confirm(`Delete "${field.label}"? This cannot be undone.`)) return;
    try {
      await deleteFieldAsync({ formId, formFieldId: field.id });
      if (selectedFieldId === field.id) setSelectedFieldId(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete this field.");
    }
  }
  async function moveField(field: BuilderField, direction: -1 | 1) {
    const orderedFields = [...(fields as BuilderField[])].sort((a, b) => a.fieldOrder - b.fieldOrder);
    const currentIndex = orderedFields.findIndex((item) => item.id === field.id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedFields.length) return;
    [orderedFields[currentIndex], orderedFields[targetIndex]] = [
      orderedFields[targetIndex]!,
      orderedFields[currentIndex]!,
    ];
    try {
      await reorderFieldsAsync({ formId, orderedFieldIds: orderedFields.map((item) => item.id) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reorder fields.");
    }
  }
  async function reorderFields(orderedFieldIds: string[]) {
    try {
      await reorderFieldsAsync({ formId, orderedFieldIds });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reorder fields.");
    }
  }

  if (!isSessionPending && !session?.user) return null;
  if (formQuery.isError) return <div className="p-8"><p className="text-sm text-destructive">Unable to load this form.</p><button className="mt-4 text-sm underline" onClick={() => router.push("/dashboard")}>Back to dashboard</button></div>;
  if (isSessionPending || formQuery.isPending || !form) return <div className="p-8 text-sm text-muted-foreground">Loading form...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <BuilderHeader
        title={displayTitle}
        onTitleChange={setTitle}
        onTitleSave={() => void saveTitle()}
        onPreview={() => setPreviewOpen(true)}
        onShare={() => void handleShare()}
        onPublish={() => void publishForm()}
        isPublished={form.isPublished || Boolean(publishedUrl)}
        isPublishing={isPublishing}
      />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <FieldTypePalette onAdd={(definition) => void addField(definition)} />
        <FormCanvas fields={[...(fields as BuilderField[])].sort((a, b) => a.fieldOrder - b.fieldOrder)} selectedFieldId={selectedFieldId} title={title} description={description} onTitleChange={setTitle} onTitleSave={() => void saveTitle()} onDescriptionChange={setDescription} onDescriptionSave={() => void saveDescription()} onSelect={(field) => setSelectedFieldId(field.id)} onEdit={(field) => setSelectedFieldId(field.id)} onDelete={(field) => void deleteFieldFromCanvas(field)} onMove={(field, direction) => void moveField(field, direction)} onReorder={(orderedFieldIds) => void reorderFields(orderedFieldIds)} onAdd={() => void addField(fieldTypes[0]!)} />
        <aside className="border-t bg-background lg:w-80 lg:shrink-0 lg:border-l lg:border-t-0">
          <AiFormGenerator formId={formId} />
          <FormSettingsBar
            isPublished={form.isPublished || Boolean(publishedUrl)}
            isOpen={isOpen}
            responseLimit={responseLimit}
            canEditResponseLimit={userRoleQuery.data?.userRole === "admin"}
            onOpenChange={(nextIsOpen) => void handleOpenChange(nextIsOpen)}
            onResponseLimitSave={(limit) => void handleResponseLimitSave(limit)}
          />
          <FieldInspector field={selectedField} onSave={saveField} onDelete={deleteSelectedField} />
        </aside>
      </div>
      {fieldsQuery.isFetching ? <p className="fixed bottom-4 right-4 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">Saving...</p> : null}
      {fieldsQuery.isError ? <p className="fixed bottom-4 left-4 rounded-md border border-destructive bg-background px-3 py-2 text-xs text-destructive" role="alert">Unable to load form fields.</p> : null}
      <FormPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} title={title} description={description} fields={fields as BuilderField[]} />
      <ShareFormDialog open={shareOpen} onOpenChange={setShareOpen} formUrl={publishedUrl} isPublished={form.isPublished || Boolean(publishedUrl)} isPublishing={isPublishing} />
    </div>
  );
}