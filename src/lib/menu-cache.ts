import type { PublicMenuCategory, RestaurantPublic } from "@/types/api";

// Menyu cache: module Map (SPA naviqasiyalar arası) + sessionStorage (Safari
// səhifəni evict edib yenidən yükləyəndə). Stale-while-revalidate: cache hit
// dərhal render olunur, arxa fonda təzə fetch səssiz yeniləyir.

export interface CachedMenu {
  categories: PublicMenuCategory[];
  branchInfo: RestaurantPublic | null;
  ts: number;
}

const mem = new Map<string, CachedMenu>();

export function menuCacheKey(tenantSlug: string, branchSlug?: string | null): string {
  return `menu-cache:${tenantSlug}|${branchSlug ?? ""}`;
}

export function getCachedMenu(key: string): CachedMenu | null {
  const hit = mem.get(key);
  if (hit) return hit;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedMenu;
    if (!Array.isArray(parsed?.categories) || parsed.categories.length === 0) return null;
    mem.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function setCachedMenu(key: string, data: CachedMenu): void {
  mem.set(key, data);
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota və ya private mode — mem cache yenə işləyir
  }
}
