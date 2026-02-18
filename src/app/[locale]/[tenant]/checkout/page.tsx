import type { Metadata } from "next";
import { getDictionary } from "@/i18n/get-dictionary";
import { isValidLocale, locales, type Locale } from "@/i18n/config";
import { fetchTenantConfig } from "@/lib/tenant";
import CheckoutPageClient from "./CheckoutPageClient";

interface Props {
  params: Promise<{ locale: string; tenant: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tenant } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const tenantConfig = await fetchTenantConfig(tenant);
  const tenantName = tenantConfig?.name || tenant;

  return {
    title: `${dict.nav.checkout} | ${tenantName}`,
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}/${tenant}/checkout`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/${tenant}/checkout`])
      ),
    },
  };
}

export default async function CheckoutPage({ params }: Props) {
  const { locale, tenant } = await params;
  if (!isValidLocale(locale)) return null;

  return <CheckoutPageClient locale={locale} tenant={tenant} />;
}
