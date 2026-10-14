"use client";

import { TemplatesPage } from "~/components/workspace/templates-page";
import { WorkspaceLayout } from "~/components/workspace/workspace-layout";

export default function TemplatesRoute() {
  return (
    <WorkspaceLayout title="Templates">
      <TemplatesPage />
    </WorkspaceLayout>
  );
}
