import type { Metadata } from "next";
import { getDictionary } from "@/i18n/get-dictionary";
import { locales, type Locale } from "@/i18n/config";
import { fetchTenantConfig } from "@/lib/tenant";
import { getPublicRestaurant } from "@/lib/api/public";
import { getMediaUrl } from "@/lib/api/client";
import type { RestaurantBranchOverride } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://walvero.com";

type Section = "menu" | "restaurant";

function pickAnnouncement(
  ov: RestaurantBranchOverride | null | undefined,
  locale: Locale
): string {
  if (!ov) return "";
  const v =
    locale === "en"
      ? ov.announcementEn || ov.announcementAz
      : locale === "ru"
      ? ov.announcementRu || ov.announcementAz
      : ov.announcementAz;
  return (v || "").trim();
}

interface BuildArgs {
  locale: Locale;
  tenantSlug: string;
  branchSlug?: string | null;
  section: Section;
}

/**
 * Public menyu/restoran səhifələri üçün link-preview metadata:
 * branch/tenant logosu (OG image + favicon) və branch-ə uyğun description.
 */
export async function buildPublicMetadata({
  locale,
  tenantSlug,
  branchSlug,
  section,
}: BuildArgs): Promise<Metadata> {
  const dict = await getDictionary(locale);
  const tenantConfig = await fetchTenantConfig(tenantSlug);
  const tenantName = tenantConfig?.name || tenantSlug;
  const tenantLogo = tenantConfig?.logo || tenantConfig?.branding?.logoUrl || null;
  const tenantDesc = (
    tenantConfig?.description ||
    tenantConfig?.branding?.description ||
    ""
  ).trim();

  let branchName: string | null = null;
  let logoPath: string | null = tenantLogo;
  let description = tenantDesc;
  // Admin-də filial üçün təyin olunan link-preview mətnləri (boşdursa fallback).
  let metaTitleOverride: string | null = null;

  if (branchSlug) {
    const branch = tenantConfig?.branches?.find((b) => b.slug === branchSlug);
    branchName = branch?.name ?? branchSlug;
    const restaurant = await getPublicRestaurant(tenantSlug, branchSlug);
    const ov = restaurant?.branch;

    const branchLogo =
      branch?.logoUrl || ov?.logoUrl || branch?.photoUrl || ov?.photoUrl || null;
    if (branchLogo) logoPath = branchLogo;

    metaTitleOverride = ov?.metaTitle?.trim() || null;

    const address = branch?.address || ov?.address || null;
    const announcement = pickAnnouncement(ov, locale);
    description =
      ov?.metaDescription?.trim() ||
      announcement ||
      tenantDesc ||
      `${tenantName} — ${branchName}${address ? `, ${address}` : ""}`;
  }

  if (!description) description = dict.meta.description;

  const title =
    metaTitleOverride ||
    (branchSlug
      ? section === "menu"
        ? `${dict.nav.menu} — ${branchName} | ${tenantName}`
        : `${branchName} — ${tenantName}`
      : section === "menu"
      ? `${dict.nav.menu} | ${tenantName}`
      : `${dict.nav.restaurant} | ${tenantName}`);

  const path = branchSlug
    ? `/${tenantSlug}/b/${branchSlug}/${section}`
    : `/${tenantSlug}/${section}`;
  const url = `${BASE_URL}/${locale}${path}`;
  const imageUrl = logoPath ? getMediaUrl(logoPath) : null;
  const imageAlt = branchSlug ? `${branchName} — ${tenantName}` : tenantName;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}${path}`])
      ),
    },
    openGraph: {
      title,
      description,
      locale,
      type: "website",
      url,
      siteName: tenantName,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: imageAlt }] } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    ...(imageUrl ? { icons: { icon: imageUrl } } : {}),
  };
}
