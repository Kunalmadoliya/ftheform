"use client";

import { AnalyticsPage } from "~/components/workspace/analytics-page";
import { WorkspaceLayout } from "~/components/workspace/workspace-layout";

export default function AnalyticsRoute() {
  return (
    <WorkspaceLayout title="Analytics">
      <AnalyticsPage />
    </WorkspaceLayout>
  );
}
