"use client";

import { AdminPage } from "~/components/admin/admin-page";
import { WorkspaceLayout } from "~/components/workspace/workspace-layout";

export default function AdminRoute() {
  return (
    <WorkspaceLayout title="Admin">
      <AdminPage />
    </WorkspaceLayout>
  );
}
