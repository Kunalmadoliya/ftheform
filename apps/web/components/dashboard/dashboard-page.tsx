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
import { useForm } from "~/hooks/form/use-form";
import { authClient } from "~/lib/auth-client";

export function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const { createFormAsync, deleteFormAsync, forms, formsQuery, isPending, renameFormAsync, updateFormDescriptionAsync } = useForm();
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
      setError(submitError instanceof Error ? submitError.message : "Unable to save the form.");
    }
  }

  async function handleCreateForm() {
    setError("");
    try {
      const form = await createFormAsync({ title: "Untitled Form" });
      router.push(`/forms/${form.id}/builder`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create the form.");
    }
  }

  async function handleDelete(formId: string) {
    if (window.confirm("Delete this form? This cannot be undone.")) await deleteFormAsync({ formId });
  }

  async function handleSignOut() { await authClient.signOut(); router.replace("/"); }
  if (isSessionPending || !session?.user) return null;

  const formSummaries = forms as FormSummary[];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <SidebarNav />
      <main className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6 lg:px-10">
          <p className="text-sm text-muted-foreground">Workspace</p>
          <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut />Sign out</Button>
        </header>
        <div className="mx-auto max-w-7xl space-y-10 px-6 py-10 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm text-muted-foreground">Welcome back, {session.user.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Dashboard</h1></div>
            <Button onClick={() => void handleCreateForm()} disabled={isPending}><FilePlus2 />{isPending ? "Creating..." : "New form"}</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* These workspace stats have no backend source yet, so keep them clearly as placeholders. */}
            <StatCard label="Total forms" value={String(forms.length)} detail="In your workspace" />
            <StatCard label="Published" value={String(forms.filter((form) => form.isPublished).length)} detail="Currently live" />
            <StatCard label="Responses" value="-" detail="Response analytics coming soon" />
            <StatCard label="This week" value="-" detail="Response analytics coming soon" />
          </div>
          <section className="space-y-4">
            <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Your forms</h2><p className="mt-1 text-sm text-muted-foreground">Create, edit, and share your forms.</p></div>{formsQuery.isPending ? <span className="text-sm text-muted-foreground">Loading...</span> : null}</div>
            <FormsGrid forms={formSummaries} onEdit={openEdit} onDelete={handleDelete} />
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