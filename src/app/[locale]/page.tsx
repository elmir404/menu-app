import type { Metadata } from "next";
import { getDictionary } from "@/i18n/get-dictionary";
import { isValidLocale, locales, type Locale } from "@/i18n/config";
import { fetchAllTenants } from "@/lib/tenant";
import LandingPageClient from "./LandingPageClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://walvero.com";

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    keywords: dict.meta.keywords,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}/${l}`])
      ),
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      locale,
      type: "website",
      url: `${baseUrl}/${locale}`,
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;

  const [dict, tenants] = await Promise.all([
    getDictionary(locale as Locale),
    fetchAllTenants(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "QrWithMenu",
        description: dict.meta.description,
        url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://walvero.com"}/${locale}`,
      },
      {
        "@type": "WebSite",
        name: "QrWithMenu",
        url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://walvero.com"}/${locale}`,
        inLanguage: locale,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient locale={locale} tenants={tenants} />
    </>
  );
}
