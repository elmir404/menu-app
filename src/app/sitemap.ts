import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { fetchAllTenantSlugs } from "@/lib/tenant";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://walvero.com";
  const tenants = await fetchAllTenantSlugs();
  const pages = ["/restaurant", "/menu"];

  const entries: MetadataRoute.Sitemap = [];

  // Landing pages per locale
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    });
  }

  // Tenant pages
  for (const tenant of tenants) {
    for (const page of pages) {
      const alternates: Record<string, string> = {};
      for (const locale of locales) {
        alternates[locale] = `${baseUrl}/${locale}/${tenant}${page}`;
      }

      entries.push({
        url: `${baseUrl}/az/${tenant}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "/restaurant" ? "weekly" : "monthly",
        priority: page === "/restaurant" ? 0.9 : 0.8,
        alternates: {
          languages: alternates,
        },
      });
    }
  }

  return entries;
}
