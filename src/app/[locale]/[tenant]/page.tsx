import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ locale: string; tenant: string }>;
}

export default async function TenantRootPage({ params }: Props) {
  const { locale, tenant } = await params;
  redirect(`/${locale}/${tenant}/restaurant`);
}
