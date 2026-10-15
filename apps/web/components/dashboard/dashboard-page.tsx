"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, LogOut } from "lucide-react";

import { SidebarNav } from "~/components/dashboard/sidebar-nav";
import { FormsGrid } from "~/components/dashboard/forms-grid";
import { type FormSummary } from "~/components/dashboard/form-card";
import { StatCard } from "~/components/dashboard/stat-card";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { ThemeToggle } from "~/components/theme-toggle";
import { useForm, useFormLifecycle, type FormLifecycleFilter } from "~/hooks/form/use-form";
import { authClient } from "~/lib/auth-client";
import Link from "next/link";
import { useSubmissionsAcrossForms } from "~/hooks/form/use-submissions-across-forms";
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
  const { createFormAsync, forms, formsQuery, isPending, renameFormAsync, updateFormDescriptionAsync, publishFormAsync, unpublishFormAsync } = useForm();
  const [lifecycle, setLifecycle] = useState<FormLifecycleFilter>("live");
  const lifecycleData = useFormLifecycle(lifecycle);
  const submissionData = useSubmissionsAcrossForms(forms.map(({ id, title }) => ({ id, title })));
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingFormId, setEditingFormId] = useState("");
  const [error, setError] = useState("");
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

  function openEdit(form: FormSummary) { setEditingFormId(form.id); setTitle(form.title); setDescription(form.description ?? ""); setError(""); setDialog("edit"); }

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
        setDeletionError("New responses arrived or the response count changed. Export again before deleting.");
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

  async function handleSignOut() { await authClient.signOut(); router.replace("/"); }
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
    <div className="flex min-h-screen bg-muted/30">
      <SidebarNav />
      <main className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6 lg:px-10">
          <p className="text-sm text-muted-foreground">Workspace</p>
          <div className="flex items-center gap-2"><ThemeToggle /><Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut />Sign out</Button></div>
        </header>
        <div className="mx-auto max-w-7xl space-y-10 px-6 py-10 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm text-muted-foreground">Welcome back, {session.user.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{showAllForms ? "All forms" : "Dashboard"}</h1></div>
            <Button onClick={() => void handleCreateForm()} disabled={isPending}><FilePlus2 />{isPending ? "Creating..." : "New form"}</Button>
          </div>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total forms" value={String(lifecycleCounts.live + lifecycleCounts.draft + lifecycleCounts.archived)} detail="In your workspace" />
            <StatCard label="Live" value={String(lifecycleCounts.live)} detail="Currently accepting responses" />
            <StatCard label="Responses" value={String(totalResponses)} detail="Submitted responses" />
            <StatCard label="Response rate" value={`${responseRate}%`} detail={`${totalViews} total views`} />
          </div>
          <section className="space-y-4">
            <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">{showAllForms ? "Your forms" : "Recent forms"}</h2><p className="mt-1 text-sm text-muted-foreground">Create, edit, and share your forms.</p></div><div className="flex items-center gap-3">{lifecycleData.formsQuery.isPending ? <span className="text-sm text-muted-foreground">Loading...</span> : null}{!showAllForms ? <Link href="/forms" className="text-sm font-medium text-primary hover:underline">View all →</Link> : null}</div></div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Form lifecycle">
              {(["live", "draft", "archived"] as const).map((filter) => (
                <Button
                  key={filter}
                  type="button"
                  role="tab"
                  aria-selected={lifecycle === filter}
                  variant={lifecycle === filter ? "default" : "outline"}
                  onClick={() => setLifecycle(filter)}
                >
                  {filter === "live" ? "Live" : filter === "draft" ? "Draft" : "Archived"}
                  <span className="ml-1">{lifecycleCounts[filter]}</span>
                </Button>
              ))}
            </div>
            {lifecycleData.formsQuery.isError ? (
              <p className="text-sm text-destructive" role="alert">Unable to load your forms.</p>
            ) : (
              <FormsGrid forms={visibleForms} onEdit={openEdit} onDelete={handleDelete} onArchive={handleArchive} onRestore={handleRestore} onPublish={handlePublish} onUnpublish={handleUnpublish} />
            )}
          </section>
        </div>
      </main>
      <Dialog open={dialog !== null} onOpenChange={(open) => {
        if (!open && !isDeleting) {
          setDialog(null);
          setDeletingForm(null);
        }
      }}>
        <DialogContent>
          {dialog === "edit" ? (
            <>
              <DialogHeader><DialogTitle>Edit form</DialogTitle><DialogDescription>Give your form a clear purpose so people know how to respond.</DialogDescription></DialogHeader>
              <form className="space-y-4" onSubmit={handleEditSubmit}>
                <div className="space-y-2"><Label htmlFor="form-title">Title</Label><Input id="form-title" value={title} onChange={(event) => setTitle(event.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="form-description">Description</Label><Textarea id="form-description" value={description} onChange={(event) => setDescription(event.target.value)} /></div>
                {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
                <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save form"}</Button></DialogFooter>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Delete {deletingForm?.title ?? "form"} permanently?</DialogTitle>
                <DialogDescription>
                  {deletionPreview?.submittedCount === 0
                    ? "This permanently deletes the form and any in-progress responses. This cannot be undone."
                    : `This permanently deletes the form and all ${deletionPreview?.submittedCount ?? 0} submitted responses. This cannot be undone.`}
                </DialogDescription>
              </DialogHeader>
              {isLoadingPreview ? <p className="text-sm text-muted-foreground">Checking responses...</p> : null}
              {deletionPreview && deletionPreview.submittedCount > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-form-title">Type “{deletingForm?.title}” to confirm</Label>
                    <Input
                      id="delete-form-title"
                      value={deleteTitleConfirmation}
                      onChange={(event) => setDeleteTitleConfirmation(event.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  {deletionPreview.inProgressCount > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {deletionPreview.inProgressCount} in-progress response(s) will also be deleted.
                    </p>
                  ) : null}
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      disabled={isDeleting || isExporting || requiresCsvRefresh || mustDeleteUsingExport || deleteTitleConfirmation !== deletingForm?.title}
                      onClick={() => void handlePermanentDelete(deletionPreview.submittedCount)}
                    >
                      {isDeleting ? "Deleting..." : "Delete form and all responses"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={isDeleting || isExporting}
                      onClick={() => void handleExportCsv()}
                    >
                      {isExporting ? "Exporting..." : "Download CSV, then delete"}
                    </Button>
                    {exportedSubmittedCount !== null ? (
                      <Button
                        variant="destructive"
                        disabled={isDeleting || isExporting || deleteTitleConfirmation !== deletingForm?.title}
                        onClick={() => void handlePermanentDelete(exportedSubmittedCount)}
                      >
                        {isDeleting ? "Deleting..." : "Delete after CSV download"}
                      </Button>
                    ) : null}
                  </DialogFooter>
                </div>
              ) : deletionPreview ? (
                <DialogFooter>
                  <Button
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={() => void handlePermanentDelete(0)}
                  >
                    {isDeleting ? "Deleting..." : "Delete form"}
                  </Button>
                </DialogFooter>
              ) : null}
              {deletionError ? <p className="text-sm text-destructive" role="alert">{deletionError}</p> : null}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}