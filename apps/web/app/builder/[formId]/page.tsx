"use client";

import { BuilderPage } from "~/components/builder/builder-page";
import { useParams } from "next/navigation";

export default function BuilderRoute() {
  const params = useParams<{ formId: string }>();

  return <BuilderPage formId={params.formId} />;
}