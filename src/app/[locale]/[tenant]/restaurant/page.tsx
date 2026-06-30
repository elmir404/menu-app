import type { Metadata } from "next";
import { isValidLocale } from "@/i18n/config";
import { buildPublicMetadata } from "@/lib/metadata";
import RestaurantPageClient from "./RestaurantPageClient";

interface Props {
  params: Promise<{ locale: string; tenant: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tenant } = await params;
  if (!isValidLocale(locale)) return {};
  return buildPublicMetadata({ locale, tenantSlug: tenant, section: "restaurant" });
}

export default async function RestaurantPage({ params }: Props) {
  const { locale, tenant } = await params;
  if (!isValidLocale(locale)) return null;

  return (
    <RestaurantPageClient
      locale={locale}
      tenantSlug={tenant}
    />
  );
}
