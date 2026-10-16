"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useUserRole } from "~/hooks/auth/use-user-role";
import { useForm, useFormLifecycle } from "~/hooks/form/use-form";
import { useSubmissionsAcrossForms } from "~/hooks/form/use-submissions-across-forms";
import { useHealth } from "~/hooks/api/health";
import { IconAdmin, IconSpinner } from "~/components/icons/app-icons";

export function AdminPage() {
  const router = useRouter();
  const userRoleQuery = useUserRole();

  useEffect(() => {
    if (userRoleQuery.isPending) return;
    if (userRoleQuery.isError || userRoleQuery.data?.userRole !== "admin") {
      router.replace("/dashboard");
    }
  }, [userRoleQuery.isPending, userRoleQuery.isError, userRoleQuery.data?.userRole, router]);

  const { formsQuery } = useForm();
  const forms = formsQuery.data ?? [];
  const { formsQuery: lifecycleQuery } = useFormLifecycle("live");
  const counts = lifecycleQuery.data?.counts ?? { live: 0, draft: 0, archived: 0 };
  const { entries } = useSubmissionsAcrossForms(
    forms.map(({ id, title }) => ({ id, title })),
  );
  const totalSubmissions = entries.reduce(
    (sum, entry) => sum + entry.submissions.length,
    0,
  );
  const health = useHealth();

  if (userRoleQuery.isPending) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <IconSpinner className="size-4 animate-spin" />
          <span>Verifying admin permissions...</span>
        </div>
      </div>
    );
  }

  if (userRoleQuery.data?.userRole !== "admin") {
    return null;
  }

  const apiStatusText = health.isError
    ? "Degraded"
    : health.status === "pending"
      ? "Checking..."
      : "Operational";

  return (
    <div className="space-y-8">
      {/* Header and UI-gated notice */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-card">
            <IconAdmin className="size-4" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Admin Overview</h1>
            <p className="text-xs font-mono text-muted-foreground">Workspace administration</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">
          UI-gated only. The server does not expose extra admin data.
        </div>
      </div>

      {/* Bento Tiles with Real Numbers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* API Health */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-mono text-xs text-muted-foreground">API Health</p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                health.isError
                  ? "bg-destructive"
                  : health.status === "pending"
                    ? "bg-muted-foreground"
                    : "bg-foreground"
              }`}
            />
            <span className="font-mono text-xl font-semibold text-foreground">
              {apiStatusText}
            </span>
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Backend tRPC service
          </p>
        </div>

        {/* Total Forms */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-mono text-xs text-muted-foreground">Admin Total Forms</p>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">
            {forms.length}
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {counts.live} live • {counts.draft} draft • {counts.archived} archived
          </p>
        </div>

        {/* Live Forms */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-mono text-xs text-muted-foreground">Published Forms</p>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">
            {counts.live}
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Actively collecting input
          </p>
        </div>

        {/* Total Submissions */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-mono text-xs text-muted-foreground">Total Submissions</p>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">
            {totalSubmissions}
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Across all admin forms
          </p>
        </div>
      </div>

      {/* Backend Gap Placeholders */}
      <div className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Backend Capabilities & Gaps
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-center font-mono text-xs text-muted-foreground">
            Global user management: no multi-user endpoint exists yet.
          </div>
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-center font-mono text-xs text-muted-foreground">
            System-wide form telemetry: no global listing endpoint exists yet.
          </div>
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-center font-mono text-xs text-muted-foreground">
            Billing, plans and AI credits: not implemented in the backend yet.
          </div>
        </div>
      </div>
    </div>
  );
}
