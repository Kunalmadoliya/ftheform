"use client";

import { ResponsesPage } from "~/components/workspace/responses-page";
import { WorkspaceLayout } from "~/components/workspace/workspace-layout";

export default function AllResponsesRoute() {
  return (
    <WorkspaceLayout title="Responses">
      <ResponsesPage />
    </WorkspaceLayout>
  );
}
