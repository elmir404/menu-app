import type { Metadata } from "next";
import { getDictionary } from "@/i18n/get-dictionary";
import { isValidLocale, locales, type Locale } from "@/i18n/config";
import { fetchTenantConfig } from "@/lib/tenant";
import RestaurantPageClient from "./RestaurantPageClient";

interface Props {
  params: Promise<{ locale: string; tenant: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tenant } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const tenantConfig = await fetchTenantConfig(tenant);
  const tenantName = tenantConfig?.name || tenant;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://walvero.com";

  return {
    title: `${dict.nav.restaurant} | ${tenantName}`,
    description: dict.meta.description,
    alternates: {
      canonical: `${baseUrl}/${locale}/${tenant}/restaurant`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}/${l}/${tenant}/restaurant`])
      ),
    },
    openGraph: {
      title: `${dict.nav.restaurant} | ${tenantName}`,
      description: dict.meta.description,
      locale,
      type: "website",
    },
  };
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
