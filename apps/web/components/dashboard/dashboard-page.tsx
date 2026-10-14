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
import { useForm } from "~/hooks/form/use-form";
import { authClient } from "~/lib/auth-client";
import Link from "next/link";
import { useSubmissionsAcrossForms } from "~/hooks/form/use-submissions-across-forms";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";

export function DashboardPage({ showAllForms = false }: { showAllForms?: boolean }) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const { createFormAsync, deleteFormAsync, forms, formsQuery, isPending, renameFormAsync, updateFormDescriptionAsync, publishFormAsync, unpublishFormAsync } = useForm();
  const submissionData = useSubmissionsAcrossForms(forms.map(({ id, title }) => ({ id, title })));
  const [dialog, setDialog] = useState<"edit" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingFormId, setEditingFormId] = useState("");
  const [error, setError] = useState("");

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

  async function handleDelete(formId: string) {
    if (!window.confirm("Archive this form? It will stop accepting responses, but collected response history will be preserved.")) return;
    try {
      await deleteFormAsync({ formId });
    } catch (deleteError) {
      setError(getTrpcErrorMessage(deleteError, "Unable to delete the form."));
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

  const formSummaries = forms as FormSummary[];
  const visibleForms = showAllForms ? formSummaries : formSummaries.slice(0, 3);
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
            <StatCard label="Total forms" value={String(forms.length)} detail="In your workspace" />
            <StatCard label="Published" value={String(forms.filter((form) => form.isPublished).length)} detail="Currently live" />
            <StatCard label="Responses" value={String(totalResponses)} detail="Submitted responses" />
            <StatCard label="Response rate" value={`${responseRate}%`} detail={`${totalViews} total views`} />
          </div>
          <section className="space-y-4">
            <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">{showAllForms ? "Your forms" : "Recent forms"}</h2><p className="mt-1 text-sm text-muted-foreground">Create, edit, and share your forms.</p></div><div className="flex items-center gap-3">{formsQuery.isPending ? <span className="text-sm text-muted-foreground">Loading...</span> : null}{!showAllForms ? <Link href="/forms" className="text-sm font-medium text-primary hover:underline">View all →</Link> : null}</div></div>
            {formsQuery.isError ? (
              <p className="text-sm text-destructive" role="alert">Unable to load your forms.</p>
            ) : (
              <FormsGrid forms={visibleForms} onEdit={openEdit} onDelete={handleDelete} onPublish={handlePublish} onUnpublish={handleUnpublish} />
            )}
          </section>
        </div>
      </main>
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit form</DialogTitle><DialogDescription>Give your form a clear purpose so people know how to respond.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}><div className="space-y-2"><Label htmlFor="form-title">Title</Label><Input id="form-title" value={title} onChange={(event) => setTitle(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="form-description">Description</Label><Textarea id="form-description" value={description} onChange={(event) => setDescription(event.target.value)} /></div>{error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}<DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save form"}</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>
    </div>
  );
}