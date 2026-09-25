"use client";

import { useParams } from "next/navigation";

import { BuilderPage } from "~/components/builder/builder-page";

export default function BuilderRoute() {
  const params = useParams<{ formId: string }>();

  return <BuilderPage formId={params.formId} />;
}
