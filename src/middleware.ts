import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { defaultLocale, isValidLocale, type Locale } from "@/i18n/config";
import { couldBeTenantSlug, defaultTenant } from "@/lib/tenant";

function getPreferredLocale(headers: Headers): Locale {
  const acceptLanguage = headers.get("accept-language") || "";
  const preferred = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, q] = lang.trim().split(";q=");
      return {
        code: code.split("-")[0].toLowerCase(),
        q: q ? parseFloat(q) : 1,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { code } of preferred) {
    if (isValidLocale(code)) {
      return code;
    }
  }

  return defaultLocale;
}

const KNOWN_PAGES = new Set(["restaurant", "menu", "checkout"]);

// Backend "Tenant Admin" (iki sözlə) göndərir, amma bəzi sistemlərdə "TenantAdmin" (bir sözlə) də ola bilər
const ADMIN_ALLOWED_ROLES = new Set([
  "TenantAdmin",
  "Tenant Admin", // Backend-dən gələn format
  "SuperAdmin",
  "Super Admin", // Ehtimal olunan format
]);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip internal paths and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ── Admin route protection ──────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check roles — only TenantAdmin and SuperAdmin can access admin panel
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const session = req.auth as any;
    const roles: string[] =
      session?.roles ||
      session?.user?.roles ||
      [];
    const hasAccess = roles.some((r) => ADMIN_ALLOWED_ROLES.has(r));

    if (!hasAccess) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "AccessDenied");
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ── Skip login page ────────────────────────────────────────────────────
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // ── Locale routing (public pages) ──────────────────────────────────────
  const segments = pathname.split("/").filter(Boolean);

  // Root "/" → /{preferredLocale}
  if (segments.length === 0) {
    const locale = getPreferredLocale(req.headers);
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  const first = segments[0];

  // First segment IS a valid locale
  if (isValidLocale(first)) {
    if (segments.length === 1) {
      return NextResponse.next();
    }

    const second = segments[1];

    // /{locale}/{knownPage} → insert default tenant before page
    if (KNOWN_PAGES.has(second)) {
      const rest = segments.slice(1).join("/");
      return NextResponse.redirect(
        new URL(`/${first}/${defaultTenant}/${rest}`, req.url)
      );
    }

    return NextResponse.next();
  }

  // First segment is NOT a locale
  const locale = getPreferredLocale(req.headers);

  if (couldBeTenantSlug(first)) {
    const rest = segments.join("/");
    return NextResponse.redirect(new URL(`/${locale}/${rest}`, req.url));
  }

  const rest = segments.join("/");
  return NextResponse.redirect(
    new URL(`/${locale}/${defaultTenant}/${rest}`, req.url)
  );
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
