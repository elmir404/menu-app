import type {
  TenantConfig,
  PublicTenantListItem,
  ApiResponse,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/** Cache TTL in seconds for tenant data (used by Next.js fetch cache). */
const REVALIDATE_SECONDS = 60;

// ─── Local seed data (fallback when API is unavailable) ─────────────────────
const seedTenants: Record<string, TenantConfig> = {
  walvero: {
    id: 0,
    name: "Walvero",
    slug: "walvero",
    description: "Digital menu platform for modern restaurants",
    logo: null,
    primaryColor: "#1c1917",
    domain: "walvero.com",
    menuApiUrl: "/menu.json",
    wifiInformation: [],
    branding: null,
  },
};

// ─── Public API ──────────────────────────────────────────────────────────────

export const defaultTenant = "walvero";

/**
 * Fetch a single tenant config by slug.
 * Uses NEXT_PUBLIC_API_URL + /api/public/tenants/{slug}.
 * Falls back to seed data when the API is not configured or unreachable.
 */
export async function fetchTenantConfig(
  slug: string
): Promise<TenantConfig | null> {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/tenants/${slug}`, {
        next: { revalidate: REVALIDATE_SECONDS },
      });
      if (res.ok) {
        const json: ApiResponse<TenantConfig> = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
      return null;
    } catch {
      // API unreachable — fall through to seed data
    }
  }

  return seedTenants[slug] ?? null;
}

/**
 * Fetch all tenants (for sitemap, landing page, etc.).
 */
export async function fetchAllTenants(): Promise<PublicTenantListItem[]> {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/tenants`, {
        next: { revalidate: REVALIDATE_SECONDS },
      });
      if (res.ok) {
        const json: ApiResponse<PublicTenantListItem[]> = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // fall through
    }
  }

  return Object.values(seedTenants).map((t) => ({
    name: t.name,
    slug: t.slug,
    description: t.description,
  }));
}

/**
 * Get all tenant slugs (for sitemap generation).
 */
export async function fetchAllTenantSlugs(): Promise<string[]> {
  const tenants = await fetchAllTenants();
  return tenants.map((t) => t.slug);
}

/**
 * Fetch tenant config by numeric ID.
 * Iterates over all tenant slugs and fetches full configs to match by ID.
 * Used during login to resolve tenantId → slug/name for the session.
 */
export async function fetchTenantById(
  tenantId: number
): Promise<TenantConfig | null> {
  // Check seed data first
  for (const t of Object.values(seedTenants)) {
    if (t.id === tenantId) return t;
  }

  if (!API_BASE_URL) return null;

  try {
    const slugs = await fetchAllTenantSlugs();
    for (const slug of slugs) {
      const config = await fetchTenantConfig(slug);
      if (config && config.id === tenantId) {
        return config;
      }
    }
  } catch {
    // Failed to resolve tenant
  }

  return null;
}

// ─── Sync helpers (for middleware) ──────────────────────────────────────────

const RESERVED_SEGMENTS = new Set([
  "api",
  "_next",
  "restaurant",
  "menu",
  "checkout",
  "login",
  "admin",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
]);

/**
 * Quick sync check: could this segment be a tenant slug?
 * Does NOT guarantee the tenant exists.
 */
export function couldBeTenantSlug(segment: string): boolean {
  if (!segment || RESERVED_SEGMENTS.has(segment)) return false;
  return (
    /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$/.test(segment) ||
    /^[a-z0-9]{1,2}$/.test(segment)
  );
}
