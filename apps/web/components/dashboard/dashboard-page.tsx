"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconAi,
  IconArrowRight,
  IconCreate,
  IconLogOut,
  IconSpinner,
} from "~/components/icons/app-icons";

import { SidebarNav } from "~/components/dashboard/sidebar-nav";
import { FormsGrid } from "~/components/dashboard/forms-grid";
import { type FormSummary } from "~/components/dashboard/form-card";
import { StatCard } from "~/components/dashboard/stat-card";
import { CreateAiDialog } from "~/components/dashboard/create-ai-dialog";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ThemeToggle } from "~/components/theme-toggle";
import { useForm, useFormLifecycle, type FormLifecycleFilter } from "~/hooks/form/use-form";
import { useSubmissionsAcrossForms } from "~/hooks/form/use-submissions-across-forms";
import { authClient } from "~/lib/auth-client";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";

function getTrpcCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("data" in error)) return undefined;
  const data = error.data;
  if (typeof data !== "object" || data === null || !("code" in data)) return undefined;
  return typeof data.code === "string" ? data.code : undefined;
}

export function DashboardPage({ showAllForms = false }: { showAllForms?: boolean }) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const {
    createFormAsync,
    forms,
    formsQuery,
    isPending,
    renameFormAsync,
    updateFormDescriptionAsync,
    publishFormAsync,
    unpublishFormAsync,
  } = useForm();
  const [lifecycle, setLifecycle] = useState<FormLifecycleFilter>("live");
  const lifecycleData = useFormLifecycle(lifecycle);
  const submissionData = useSubmissionsAcrossForms(forms.map(({ id, title }) => ({ id, title })));

  // Dialog state
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingFormId, setEditingFormId] = useState("");
  const [error, setError] = useState("");

  // AI creation dialog & landing handoff state
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState("");
  const hasCheckedPendingPrompt = useRef(false);

  // Deletion state
  const [deletingForm, setDeletingForm] = useState<FormSummary | null>(null);
  const [deletionPreview, setDeletionPreview] = useState<{
    submittedCount: number;
    inProgressCount: number;
    isPublished: boolean;
    isArchived: boolean;
  } | null>(null);
  const [deleteTitleConfirmation, setDeleteTitleConfirmation] = useState("");
  const [exportedSubmittedCount, setExportedSubmittedCount] = useState<number | null>(null);
  const [requiresCsvRefresh, setRequiresCsvRefresh] = useState(false);
  const [mustDeleteUsingExport, setMustDeleteUsingExport] = useState(false);
  const [deletionError, setDeletionError] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isSessionPending && !session?.user) router.replace("/login");
  }, [isSessionPending, router, session]);

  // Read pending_ai_prompt from landing on mount after session is resolved
  useEffect(() => {
    if (isSessionPending || !session?.user) return;
    if (hasCheckedPendingPrompt.current) return;
    hasCheckedPendingPrompt.current = true;

    try {
      const raw = window.localStorage.getItem("pending_ai_prompt");
      if (!raw) return;
      window.localStorage.removeItem("pending_ai_prompt");

      const parsed = JSON.parse(raw) as { prompt?: unknown; savedAt?: unknown };
      if (typeof parsed !== "object" || parsed === null) return;
      const { prompt, savedAt } = parsed;
      if (typeof prompt !== "string" || !prompt.trim()) return;

      const age = Date.now() - Number(savedAt);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Number.isFinite(age) && age >= 0 && age < twentyFourHours) {
        setAiInitialPrompt(prompt.trim());
        setIsAiDialogOpen(true);
      }
    } catch {
      // Ignore parsing or storage access errors
    }
  }, [isSessionPending, session]);

  function openEdit(form: FormSummary) {
    setEditingFormId(form.id);
    setTitle(form.title);
    setDescription(form.description ?? "");
    setError("");
    setDialog("edit");
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await renameFormAsync({ formId: editingFormId, title });
      await updateFormDescriptionAsync({ formId: editingFormId, description: description || null });
      setDialog(null);
    } catch (submitError) {
      setError(getTrpcErrorMessage(submitError, "Unable to save the form."));
    }
  }

  async function handleCreateForm() {
    setError("");
    try {
      const form = await createFormAsync({ title: "Untitled Form" });
      router.push(`/forms/${form.id}/builder`);
    } catch (createError) {
      setError(getTrpcErrorMessage(createError, "Unable to create the form."));
    }
  }

  async function handleArchive(formId: string) {
    try {
      await lifecycleData.archiveFormAsync({ formId });
    } catch (archiveError) {
      setError(getTrpcErrorMessage(archiveError, "Unable to archive the form."));
    }
  }

  async function handleRestore(formId: string) {
    try {
      await lifecycleData.restoreFormAsync({ formId });
    } catch (restoreError) {
      setError(getTrpcErrorMessage(restoreError, "Unable to restore the form."));
    }
  }

  async function handleDelete(formId: string) {
    const formToDelete = lifecycleData.formsQuery.data?.forms.find((form) => form.id === formId);
    if (!formToDelete) return;
    setDeletingForm(formToDelete);
    setDeletionPreview(null);
    setExportedSubmittedCount(null);
    setRequiresCsvRefresh(false);
    setMustDeleteUsingExport(false);
    setDeleteTitleConfirmation("");
    setDeletionError("");
    setIsLoadingPreview(true);
    setDialog("delete");
    try {
      const preview = await lifecycleData.getDeletionPreview(formId);
      setDeletionPreview(preview);
    } catch (previewError) {
      setDeletionError(getTrpcErrorMessage(previewError, "Unable to check the form's responses."));
    } finally {
      setIsLoadingPreview(false);
    }
  }

  function downloadCsv(csv: string, formTitle: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${formTitle.replace(/[^\w-]+/g, "-")}-responses.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleExportCsv() {
    if (!deletingForm) return;
    setIsExporting(true);
    setDeletionError("");
    try {
      const exported = await lifecycleData.exportCsv(deletingForm.id);
      downloadCsv(exported.csv, deletingForm.title);
      setExportedSubmittedCount(exported.submittedCount);
      setRequiresCsvRefresh(false);
    } catch (exportError) {
      setDeletionError(getTrpcErrorMessage(exportError, "Unable to export responses."));
    } finally {
      setIsExporting(false);
    }
  }

  async function handlePermanentDelete(expectedSubmittedCount: number) {
    if (!deletingForm) return;
    setIsDeleting(true);
    setDeletionError("");
    try {
      await lifecycleData.deleteFormAsync({
        formId: deletingForm.id,
        ...(expectedSubmittedCount > 0
          ? { confirmDeleteResponses: true, expectedSubmittedCount }
          : {}),
      });
      setDialog(null);
      setDeletingForm(null);
    } catch (deleteError) {
      const code = getTrpcCode(deleteError);
      if (code === "NOT_FOUND") {
        setDialog(null);
        setDeletingForm(null);
        await lifecycleData.formsQuery.refetch();
        await formsQuery.refetch();
      } else if (code === "CONFLICT") {
        setExportedSubmittedCount(null);
        setRequiresCsvRefresh(true);
        setMustDeleteUsingExport(true);
        setDeletionError(
          "New responses arrived or the response count changed. Export again before deleting.",
        );
        setIsLoadingPreview(true);
        try {
          setDeletionPreview(await lifecycleData.getDeletionPreview(deletingForm.id));
        } catch (previewError) {
          setDeletionError(getTrpcErrorMessage(previewError, "Refresh the response count and export again."));
        } finally {
          setIsLoadingPreview(false);
        }
      } else {
        setDeletionError(getTrpcErrorMessage(deleteError, "Unable to permanently delete the form."));
      }
    } finally {
      setIsDeleting(false);
    }
  }

  async function handlePublish(formId: string) {
    try {
      await publishFormAsync({ formId });
    } catch (publishError) {
      setError(getTrpcErrorMessage(publishError, "Unable to publish the form."));
    }
  }

  async function handleUnpublish(formId: string) {
    try {
      await unpublishFormAsync({ formId });
    } catch (unpublishError) {
      setError(getTrpcErrorMessage(unpublishError, "Unable to unpublish the form."));
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/");
  }

  if (isSessionPending || !session?.user) return null;

  const formSummaries = (lifecycleData.formsQuery.data?.forms ?? []) as FormSummary[];
  const visibleForms = showAllForms ? formSummaries : formSummaries.slice(0, 3);
  const lifecycleCounts = lifecycleData.formsQuery.data?.counts ?? { live: 0, draft: 0, archived: 0 };
  const totalResponses = submissionData.entries.reduce(
    (total, entry) => total + entry.submissions.length,
    0,
  );
  const totalViews = forms.reduce((total, form) => total + form.views, 0);
  const responseRate = totalViews > 0 ? Math.round((totalResponses / totalViews) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <main className="min-w-0 flex-1">
        {/* Top Header */}
        <header className="flex h-14 items-center justify-between border-b border-border px-6 lg:px-10">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-foreground">{showAllForms ? "All forms" : "Dashboard"}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <IconLogOut className="size-3.5" />
              Sign out
            </Button>
          </div>
        </header>

        {/* Content Container */}
        <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-10">
          {/* Welcome & Actions */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
            <div>
              <p className="text-xs text-muted-foreground">Welcome back, {session.user.name}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {showAllForms ? "All forms" : "Dashboard"}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAiInitialPrompt("");
                  setIsAiDialogOpen(true);
                }}
                className="h-9 gap-1.5 text-xs font-medium"
              >
                <IconAi className="size-3.5" />
                Create with AI
              </Button>
              <Button
                size="sm"
                onClick={() => void handleCreateForm()}
                disabled={isPending}
                className="h-9 gap-1.5 text-xs font-medium"
              >
                {isPending ? (
                  <>
                    <IconSpinner className="size-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <IconCreate className="size-3.5" />
                    Create form
                  </>
                )}
              </Button>
            </div>
          </div>

          {error ? (
            <p className="rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {/* Real Metrics Grid */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total forms"
              value={String(lifecycleCounts.live + lifecycleCounts.draft + lifecycleCounts.archived)}
              detail="Forms in workspace"
            />
            <StatCard
              label="Live"
              value={String(lifecycleCounts.live)}
              detail="Accepting responses"
            />
            <StatCard
              label="Responses"
              value={String(totalResponses)}
              detail="Total submissions"
            />
            <StatCard
              label="Response rate"
              value={`${responseRate}%`}
              detail={`${totalViews} total views`}
            />
          </div>

          {/* Forms Section */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {showAllForms ? "Your forms" : "Recent forms"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Manage, preview, and monitor your active and draft forms.
                </p>
              </div>

              {!showAllForms ? (
                <Link
                  href="/forms"
                  className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  View all
                  <IconArrowRight className="size-3" />
                </Link>
              ) : null}
            </div>

            {/* Lifecycle Tabs */}
            <Tabs
              value={lifecycle}
              onValueChange={(val) => setLifecycle(val as FormLifecycleFilter)}
              className="w-full"
            >
              <div className="flex items-center justify-between">
                <TabsList aria-label="Form lifecycle filter">
                  {(["live", "draft", "archived"] as const).map((filter) => (
                    <TabsTrigger key={filter} value={filter} className="text-xs">
                      {filter === "live" ? "Live" : filter === "draft" ? "Draft" : "Archived"}
                      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                        {lifecycleCounts[filter]}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>

            {lifecycleData.formsQuery.isError ? (
              <div className="rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive" role="alert">
                Unable to load your forms. Please refresh the page to try again.
              </div>
            ) : (
              <FormsGrid
                forms={visibleForms}
                isLoading={lifecycleData.formsQuery.isPending}
                onEdit={openEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
                onCreateForm={() => void handleCreateForm()}
                onCreateAi={() => {
                  setAiInitialPrompt("");
                  setIsAiDialogOpen(true);
                }}
              />
            )}
          </section>
        </div>
      </main>

      {/* Create with AI Dialog */}
      <CreateAiDialog
        open={isAiDialogOpen}
        onOpenChange={setIsAiDialogOpen}
        initialPrompt={aiInitialPrompt}
        createFormAsync={createFormAsync}
      />

      {/* Edit Details Dialog */}
      <Dialog
        open={dialog === "edit"}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit form details</DialogTitle>
            <DialogDescription>
              Update your form title and description.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <Label htmlFor="form-title" className="text-xs font-medium">
                Title
              </Label>
              <Input
                id="form-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-description" className="text-xs font-medium">
                Description
              </Label>
              <Textarea
                id="form-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>
            {error ? (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialog(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? (
                  <>
                    <IconSpinner className="size-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save details"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Dialog with 2-Phase Safeguard */}
      <Dialog
        open={dialog === "delete"}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDialog(null);
            setDeletingForm(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deletingForm?.title ?? "form"} permanently?</DialogTitle>
            <DialogDescription>
              {deletionPreview?.submittedCount === 0
                ? "This permanently deletes the form and any in-progress responses. This action cannot be undone."
                : `This permanently deletes the form and all ${deletionPreview?.submittedCount ?? 0} submitted responses. This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          {isLoadingPreview ? (
            <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
              <IconSpinner className="size-3.5 animate-spin text-foreground" />
              <span>Checking response count...</span>
            </div>
          ) : null}

          {deletionPreview && deletionPreview.submittedCount > 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-form-title" className="text-xs font-medium">
                  Type <span className="font-mono font-bold">“{deletingForm?.title}”</span> to confirm
                </Label>
                <Input
                  id="delete-form-title"
                  value={deleteTitleConfirmation}
                  onChange={(event) => setDeleteTitleConfirmation(event.target.value)}
                  autoComplete="off"
                  className="text-xs"
                />
              </div>

              {deletionPreview.inProgressCount > 0 ? (
                <p className="font-mono text-[11px] text-muted-foreground">
                  {deletionPreview.inProgressCount} in-progress response(s) will also be deleted.
                </p>
              ) : null}

              {deletionError ? (
                <p className="text-xs text-destructive" role="alert">
                  {deletionError}
                </p>
              ) : null}

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <div className="flex w-full gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={isDeleting || isExporting}
                    onClick={() => void handleExportCsv()}
                  >
                    {isExporting ? "Exporting..." : "Download CSV, then delete"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={
                      isDeleting ||
                      isExporting ||
                      requiresCsvRefresh ||
                      mustDeleteUsingExport ||
                      deleteTitleConfirmation !== deletingForm?.title
                    }
                    onClick={() => void handlePermanentDelete(deletionPreview.submittedCount)}
                  >
                    {isDeleting ? "Deleting..." : "Delete form"}
                  </Button>
                </div>

                {exportedSubmittedCount !== null ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-full text-xs"
                    disabled={
                      isDeleting || isExporting || deleteTitleConfirmation !== deletingForm?.title
                    }
                    onClick={() => void handlePermanentDelete(exportedSubmittedCount)}
                  >
                    {isDeleting ? "Deleting..." : "Delete after CSV download"}
                  </Button>
                ) : null}
              </DialogFooter>
            </div>
          ) : deletionPreview ? (
            <div className="space-y-4">
              {deletionError ? (
                <p className="text-xs text-destructive" role="alert">
                  {deletionError}
                </p>
              ) : null}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => {
                    setDialog(null);
                    setDeletingForm(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => void handlePermanentDelete(0)}
                >
                  {isDeleting ? "Deleting..." : "Delete form"}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}