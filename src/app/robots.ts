import type { MetadataRoute } from "next";

export const dynamic = "force-static";
// (opsional) export const revalidate = 86400;

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.qrwithmenu.com"; // ✅ static export üçün sabit saxla

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

