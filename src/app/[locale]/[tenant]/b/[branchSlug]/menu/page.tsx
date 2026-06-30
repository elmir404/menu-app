import type { Metadata } from "next";
import { isValidLocale } from "@/i18n/config";
import { buildPublicMetadata } from "@/lib/metadata";
import MenuPageClient from "../../../menu/MenuPageClient";

interface Props {
  params: Promise<{ locale: string; tenant: string; branchSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tenant, branchSlug } = await params;
  if (!isValidLocale(locale)) return {};
  return buildPublicMetadata({
    locale,
    tenantSlug: tenant,
    branchSlug,
    section: "menu",
  });
}

export default async function BranchMenuPage({ params }: Props) {
  const { locale, tenant, branchSlug } = await params;
  if (!isValidLocale(locale)) return null;

  return (
    <MenuPageClient locale={locale} tenantSlug={tenant} branchSlug={branchSlug} />
  );
}
