"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconBack, IconWarning } from "~/components/icons/app-icons";
import { toast } from "sonner";

import { BuilderHeader } from "~/components/builder/builder-header";
import { FieldInspector } from "~/components/builder/field-inspector";
import { FieldTypePalette, fieldTypes } from "~/components/builder/field-type-palette";
import type { FieldTypeDefinition } from "~/components/builder/field-type-item";
import { FormCanvas, type BuilderField } from "~/components/builder/form-canvas";
import { FormSettingsBar } from "~/components/builder/form-settings-bar";
import { FormPreviewDialog } from "~/components/builder/form-preview-dialog";
import { ShareFormDialog } from "~/components/builder/share-form-dialog";
import { AiPromptDock } from "~/components/builder/ai-prompt-dock";
import { DeleteFieldDialog } from "~/components/builder/delete-field-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useForm, useFormById } from "~/hooks/form/use-form";
import { useFormFields } from "~/hooks/form/use-form-fields";
import { useUserRole } from "~/hooks/auth/use-user-role";
import { authClient } from "~/lib/auth-client";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";

type BuilderPageProps = { formId: string };

export function BuilderPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <div className="hidden w-64 border-r border-border p-3 md:flex md:flex-col gap-2">
          <Skeleton className="h-4 w-24 mb-2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
        <div className="flex-1 p-6 max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
        <div className="hidden w-80 border-l border-border p-4 md:flex md:flex-col gap-4">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function BuilderPage({ formId }: BuilderPageProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const userRoleQuery = useUserRole();
  const formQuery = useFormById(formId, !isSessionPending && Boolean(session?.user));
  const {
    renameFormAsync,
    updateFormDescriptionAsync,
    updateSettingsAsync,
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
  const [accessPolicy, setAccessPolicy] = useState<
    "anonymous_and_authenticated" | "anonymous_only" | "authenticated_only"
  >("anonymous_and_authenticated");
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string>();

  // Layout & UI state
  const [activeRightTab, setActiveRightTab] = useState<"field" | "settings">("field");
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<BuilderField | null>(null);
  const [isDeletingField, setIsDeletingField] = useState(false);

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
    setAccessPolicy(form.accessPolicy);
    setAllowMultipleSubmissions(form.allowMultipleSubmissions);
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
        toast.error(getTrpcErrorMessage(error, "Unable to save the form title."));
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
        toast.error(getTrpcErrorMessage(error, "Unable to save the form description."));
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
      toast.error(getTrpcErrorMessage(error, "Unable to update form availability."));
    }
  }

  async function handleResponseLimitSave(nextResponseLimit: number) {
    try {
      const result = await updateResponseLimitAsync({ formId, responseLimit: nextResponseLimit });
      setResponseLimit(result.responseLimit);
    } catch (error) {
      toast.error(getTrpcErrorMessage(error, "Unable to update the response limit."));
    }
  }

  async function handleSettingsChange(
    nextAccessPolicy: typeof accessPolicy,
    nextAllowMultipleSubmissions: boolean,
  ) {
    const previousAccessPolicy = accessPolicy;
    const previousAllowMultipleSubmissions = allowMultipleSubmissions;
    setAccessPolicy(nextAccessPolicy);
    setAllowMultipleSubmissions(nextAllowMultipleSubmissions);
    try {
      await updateSettingsAsync({
        formId,
        accessPolicy: nextAccessPolicy,
        allowMultipleSubmissions: nextAllowMultipleSubmissions,
      });
    } catch (error) {
      setAccessPolicy(previousAccessPolicy);
      setAllowMultipleSubmissions(previousAllowMultipleSubmissions);
      toast.error(getTrpcErrorMessage(error, "Unable to save form settings."));
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
      toast.error(getTrpcErrorMessage(error, "Unable to publish this form."));
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
    const config =
      definition.type === "select" || definition.type === "multiselect"
        ? { options: ["Option 1"] }
        : definition.type === "rating"
          ? { maxStars: 5 }
          : {};
    try {
      const field = await createFieldAsync({
        formId,
        type: definition.type,
        category: "input",
        label: definition.label,
        required: false,
        config,
      });
      setSelectedFieldId(field.id);
      setActiveRightTab("field");
    } catch (error) {
      toast.error(getTrpcErrorMessage(error, "Unable to add this field."));
    }
  }

  async function saveField(updates: {
    label: string;
    required: boolean;
    config: Record<string, unknown>;
  }) {
    if (!selectedField) return;
    try {
      await updateFieldAsync({
        formId,
        formFieldId: selectedField.id,
        label: updates.label,
        required: updates.required,
        config: updates.config,
      });
    } catch (error) {
      toast.error(getTrpcErrorMessage(error, "Unable to save this field."));
    }
  }

  async function deleteSelectedField() {
    if (!selectedField) return;
    try {
      await deleteFieldAsync({ formId, formFieldId: selectedField.id });
      setSelectedFieldId(undefined);
    } catch (error) {
      toast.error(getTrpcErrorMessage(error, "Unable to delete this field."));
    }
  }

  async function confirmDeleteField() {
    if (!fieldToDelete) return;
    setIsDeletingField(true);
    try {
      await deleteFieldAsync({ formId, formFieldId: fieldToDelete.id });
      if (selectedFieldId === fieldToDelete.id) {
        setSelectedFieldId(undefined);
      }
    } catch (error) {
      toast.error(getTrpcErrorMessage(error, "Unable to delete this field."));
    } finally {
      setIsDeletingField(false);
      setFieldToDelete(null);
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
      toast.error(getTrpcErrorMessage(error, "Unable to reorder fields."));
    }
  }

  async function reorderFields(orderedFieldIds: string[]) {
    try {
      await reorderFieldsAsync({ formId, orderedFieldIds });
    } catch (error) {
      toast.error(getTrpcErrorMessage(error, "Unable to reorder fields."));
    }
  }

  function handleSelectField(field: BuilderField) {
    setSelectedFieldId(field.id);
    setActiveRightTab("field");
  }

  if (!isSessionPending && !session?.user) return null;

  if (formQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full rounded-[var(--radius)] border border-destructive/40 bg-card p-6 text-center space-y-4">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <IconWarning className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Unable to load form</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              This form could not be loaded or you do not have permission to view it.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="w-full text-xs"
          >
            <IconBack className="size-3.5 mr-1.5" />
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isSessionPending || formQuery.isPending || !form) {
    return <BuilderPageSkeleton />;
  }

  const sortedFields = [...(fields as BuilderField[])].sort((a, b) => a.fieldOrder - b.fieldOrder);

  // Left Pane component
  const LeftPane = (
    <div className="flex h-full flex-col bg-background">
      <FieldTypePalette onAdd={(definition) => void addField(definition)} />
      <AiPromptDock formId={formId} />
    </div>
  );

  // Right Pane component
  const RightPane = (
    <div className="flex h-full flex-col bg-background">
      <Tabs
        value={activeRightTab}
        onValueChange={(val) => setActiveRightTab(val as "field" | "settings")}
        className="flex h-full flex-col"
      >
        <div className="border-b border-border p-3">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="field" className="text-xs">
              Field
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="field" className="flex-1 overflow-y-auto m-0 p-0 outline-none">
          <FieldInspector
            field={selectedField}
            onSave={saveField}
            onDelete={() => {
              if (selectedField) {
                setFieldToDelete(selectedField);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-y-auto m-0 p-0 outline-none">
          <FormSettingsBar
            isPublished={form.isPublished || Boolean(publishedUrl)}
            isOpen={isOpen}
            responseLimit={responseLimit}
            accessPolicy={accessPolicy}
            allowMultipleSubmissions={allowMultipleSubmissions}
            canEditResponseLimit={userRoleQuery.data?.userRole === "admin"}
            onOpenChange={(nextIsOpen) => void handleOpenChange(nextIsOpen)}
            onResponseLimitSave={(limit) => void handleResponseLimitSave(limit)}
            onAccessPolicyChange={(policy) =>
              void handleSettingsChange(policy, allowMultipleSubmissions)
            }
            onMultipleSubmissionsChange={(allowed) =>
              void handleSettingsChange(accessPolicy, allowed)
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );

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
        isSaving={fieldsQuery.isFetching}
        onToggleLeftPane={() => setMobileLeftOpen(true)}
        onToggleRightPane={() => setMobileRightOpen(true)}
      />

      {form.isPublished && form.hasUnpublishedChanges ? (
        <div
          className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-2.5 text-xs text-muted-foreground"
          role="status"
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-foreground" />
            <span>Unpublished changes — publish again to update the live form.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => void publishForm()}
            disabled={isPublishing}
          >
            Publish changes
          </Button>
        </div>
      ) : null}

      {fieldsQuery.isError ? (
        <div
          className="mx-4 mt-3 rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between"
          role="alert"
        >
          <span>Unable to load form fields.</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => void fieldsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {/* 3-Pane Workspace Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Desktop Pane (~260px) */}
        <aside className="hidden w-64 shrink-0 border-r border-border md:flex md:flex-col">
          {LeftPane}
        </aside>

        {/* Center Canvas */}
        <FormCanvas
          fields={sortedFields}
          selectedFieldId={selectedFieldId}
          title={title}
          description={description}
          onTitleChange={setTitle}
          onTitleSave={() => void saveTitle()}
          onDescriptionChange={setDescription}
          onDescriptionSave={() => void saveDescription()}
          onSelect={handleSelectField}
          onEdit={handleSelectField}
          onDelete={(field) => setFieldToDelete(field)}
          onMove={(field, direction) => void moveField(field, direction)}
          onReorder={(orderedFieldIds) => void reorderFields(orderedFieldIds)}
          onAdd={() => void addField(fieldTypes[0]!)}
        />

        {/* Right Desktop Pane (~300px) */}
        <aside className="hidden w-80 shrink-0 border-l border-border md:flex md:flex-col">
          {RightPane}
        </aside>
      </div>

      {/* Mobile Left Drawer (< 768px) */}
      <Sheet open={mobileLeftOpen} onOpenChange={setMobileLeftOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle className="text-xs font-semibold">Field Types & AI</SheetTitle>
          </SheetHeader>
          {LeftPane}
        </SheetContent>
      </Sheet>

      {/* Mobile Right Drawer (< 768px) */}
      <Sheet open={mobileRightOpen} onOpenChange={setMobileRightOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle className="text-xs font-semibold">Properties & Settings</SheetTitle>
          </SheetHeader>
          {RightPane}
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <FormPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={title}
        description={description}
        fields={sortedFields}
      />

      <ShareFormDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        formUrl={publishedUrl}
        isPublished={form.isPublished || Boolean(publishedUrl)}
        isPublishing={isPublishing}
      />

      <DeleteFieldDialog
        open={fieldToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingField) {
            setFieldToDelete(null);
          }
        }}
        fieldLabel={fieldToDelete?.label}
        onConfirm={confirmDeleteField}
        isDeleting={isDeletingField}
      />
    </div>
  );
}