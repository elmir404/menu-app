import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { fetchTenantConfig } from "@/lib/tenant";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { TenantProvider } from "@/components/providers/TenantProvider";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; tenant: string }>;
}) {
  const { locale, tenant } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const tenantConfig = await fetchTenantConfig(tenant);

  if (!tenantConfig) {
    notFound();
  }

  const dictionary = await getDictionary(locale as Locale);

  const brandingVars: Record<string, string> = {};
  if (tenantConfig.branding) {
    const b = tenantConfig.branding;
    if (b.primaryColor) brandingVars["--brand-primary"] = b.primaryColor;
    if (b.secondaryColor) brandingVars["--brand-secondary"] = b.secondaryColor;
    if (b.backgroundColor)
      brandingVars["--brand-background"] = b.backgroundColor;
    if (b.textColor) brandingVars["--brand-text"] = b.textColor;
  }

  return (
    <LocaleProvider locale={locale as Locale} dictionary={dictionary}>
      <TenantProvider tenant={tenantConfig}>
        <div style={brandingVars as React.CSSProperties}>{children}</div>
      </TenantProvider>
    </LocaleProvider>
  );
}
