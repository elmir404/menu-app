import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ locale: string; tenant: string; branchSlug: string }>;
}

export default async function BranchRootPage({ params }: Props) {
  const { locale, tenant, branchSlug } = await params;
  redirect(`/${locale}/${tenant}/b/${branchSlug}/restaurant`);
}
