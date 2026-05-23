import type { Metadata } from "next";
import { getDictionary } from "@/i18n/get-dictionary";
import { isValidLocale, locales } from "@/i18n/config";
import { fetchTenantConfig } from "@/lib/tenant";
import MenuPageClient from "../../../menu/MenuPageClient";

interface Props {
  params: Promise<{ locale: string; tenant: string; branchSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tenant, branchSlug } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const tenantConfig = await fetchTenantConfig(tenant);
  const tenantName = tenantConfig?.name || tenant;
  const branch = tenantConfig?.branches?.find((b) => b.slug === branchSlug);
  const branchName = branch?.name ?? branchSlug;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://walvero.com";

  return {
    title: `${dict.nav.menu} — ${branchName} | ${tenantName}`,
    description: dict.meta.description,
    alternates: {
      canonical: `${baseUrl}/${locale}/${tenant}/b/${branchSlug}/menu`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}/${l}/${tenant}/b/${branchSlug}/menu`])
      ),
    },
    openGraph: {
      title: `${dict.nav.menu} — ${branchName} | ${tenantName}`,
      description: dict.meta.description,
      locale,
      type: "website",
    },
  };
}

export default async function BranchMenuPage({ params }: Props) {
  const { locale, tenant, branchSlug } = await params;
  if (!isValidLocale(locale)) return null;

  return (
    <MenuPageClient locale={locale} tenantSlug={tenant} branchSlug={branchSlug} />
  );
}
