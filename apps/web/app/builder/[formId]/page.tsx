import { redirect } from "next/navigation";

export default async function BuilderLegacyRedirect({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  redirect(`/forms/${formId}/builder`);
}