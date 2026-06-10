import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/get-dictionary";
import { isValidLocale } from "@/i18n/config";
import { fetchTenantConfig } from "@/lib/tenant";
import { getPublicMenu } from "@/lib/api/public";
import { getLocalizedName, getLocalizedDescription } from "@/lib/i18n-helpers";
import ItemDetailClient from "./ItemDetailClient";

interface Props {
  params: Promise<{ locale: string; tenant: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tenant, id } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const tenantConfig = await fetchTenantConfig(tenant);
  const tenantName = tenantConfig?.name || tenant;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://walvero.com";
  const categories = await getPublicMenu(tenant);
  const item = categories.flatMap((c) => c.items).find((i) => i.id === Number(id));
  const itemName = item ? getLocalizedName(item, locale) : dict.nav.menu;
  const itemDesc = item
    ? getLocalizedDescription(item, locale) || dict.meta.description
    : dict.meta.description;
  const imageUrl = item?.imageUrls?.[0];
  return {
    title: `${itemName} | ${tenantName}`,
    description: itemDesc,
    alternates: {
      canonical: `${baseUrl}/${locale}/${tenant}/menu/item/${id}`,
    },
    openGraph: {
      title: `${itemName} | ${tenantName}`,
      description: itemDesc,
      images: imageUrl ? [imageUrl] : undefined,
      locale,
      type: "article",
    },
  };
}

export default async function ItemDetailPage({ params }: Props) {
  const { locale, tenant, id } = await params;
  if (!isValidLocale(locale)) return null;
  const categories = await getPublicMenu(tenant);
  const item = categories.flatMap((c) => c.items).find((i) => i.id === Number(id));
  if (!item) notFound();
  return <ItemDetailClient locale={locale} tenantSlug={tenant} item={item} />;
}
