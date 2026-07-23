"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiClock, FiGrid, FiList, FiPlus, FiSearch, FiX } from "react-icons/fi";
import RestaurantHeader from "@/components/RestaurantHeader";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import CheckoutModal from "@/components/CheckoutModal";
import ItemDetailDrawer from "./ItemDetailDrawer";
import { useDictionary } from "@/components/providers/LocaleProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useTenant } from "@/components/providers/TenantProvider";
import type { PublicMenuCategory, PublicMenuItem, RestaurantPublic } from "@/types/api";
import { getMediaUrl } from "@/lib/api/client";
import { getCachedMenu, menuCacheKey, setCachedMenu } from "@/lib/menu-cache";
import { useCart } from "@/hooks/use-cart";
import {
  getLocalizedName,
  getLocalizedDescription,
  normalizeSearch,
} from "@/lib/i18n-helpers";

const SCROLL_UPDATE_DELAY_MS = 150;
const CLICK_SCROLL_COOLDOWN_MS = 600;
const ACTIVE_SECTION_TOP_THRESHOLD = 200;

interface MenuPageClientProps {
  locale: string;
  tenantSlug: string;
  branchSlug?: string | null;
}

export default function MenuPageClient({
  locale,
  tenantSlug,
  branchSlug,
}: MenuPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dict = useDictionary();
  const currentLocale = useLocale();
  const tenantConfig = useTenant();

  const [categories, setCategories] = useState<PublicMenuCategory[]>([]);
  const [branchInfo, setBranchInfo] = useState<RestaurantPublic | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"list" | "grid">(
    tenantConfig.branding?.defaultMenuView === "list" ? "list" : "grid"
  );
  // İstifadəçi toggle edəndən sonra branch default-u tətbiq olunmasın
  const userToggledViewRef = useRef(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sectionRefs = useRef<Record<number, HTMLElement>>({});
  const headingRefs = useRef<Record<number, HTMLElement>>({});
  const categoryPillsRef = useRef<HTMLDivElement>(null);
  const categoryButtonRefs = useRef<Record<number, HTMLButtonElement>>({});
  const isClickScrollingRef = useRef(false);
  const scrollUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<PublicMenuItem | null>(null);
  const { items: cartItems, totals: cartTotals, add, increment, decrement } = useCart();
  const [lastAdded, setLastAdded] = useState<{ id: number; ts: number } | null>(null);
  const lastAddedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hadCacheRef = useRef(false);
  const didRestoreScrollRef = useRef(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
  const cacheKey = menuCacheKey(tenantSlug, branchSlug);
  const scrollKey = `menu-scroll:${pathname}`;

  // Cache hit → paint-dən əvvəl render, spinner heç görünmür.
  useLayoutEffect(() => {
    const cached = getCachedMenu(cacheKey);
    if (!cached) return;
    hadCacheRef.current = true;
    setCategories(cached.categories);
    setBranchInfo(cached.branchInfo);
    setActiveCategoryId(cached.categories[0]?.id || 0);
    setStatus("ready");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(640, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch {
      // ignore
    }
  };

  const handleAddToCart = (item: PublicMenuItem, quantity: number = 1) => {
    const name = getLocalizedName(item, currentLocale);
    add(
      {
        id: item.id,
        name,
        price: item.discountPrice > 0 ? item.discountPrice : item.price,
        currencySign: item.currencySign || "\u20BC",
      },
      quantity
    );
    if (lastAddedTimeoutRef.current) clearTimeout(lastAddedTimeoutRef.current);
    setLastAdded({ id: item.id, ts: Date.now() });
    playBeep();
    lastAddedTimeoutRef.current = setTimeout(() => setLastAdded(null), 1000);
  };

  const handleIncrement = (id: string) => {
    increment(Number(id));
  };

  const handleDecrement = (id: string) => {
    decrement(Number(id));
  };

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const url = branchSlug
          ? `${API_BASE}/api/public/menu/${tenantSlug}/${branchSlug}`
          : `${API_BASE}/api/public/menu/${tenantSlug}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load menu");
        const json = await res.json();
        if (json.success && json.data) {
          setCategories(json.data);
          if (!hadCacheRef.current) {
            setActiveCategoryId(json.data[0]?.id || 0);
          }
          setCachedMenu(cacheKey, {
            categories: json.data,
            branchInfo: getCachedMenu(cacheKey)?.branchInfo ?? null,
            ts: Date.now(),
          });
        }
        setStatus("ready");
      } catch {
        // Cache-dən artıq render olunubsa, səssiz keç — stale data göstərilir.
        if (!hadCacheRef.current) setStatus("error");
      }
    };
    loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, branchSlug, API_BASE]);

  // Branch context-də branch logo + sosial link-lər üçün restaurant data fetch
  useEffect(() => {
    if (!branchSlug) {
      setBranchInfo(null);
      return;
    }
    const loadBranchInfo = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/public/restaurants/${tenantSlug}/${branchSlug}`
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data) {
          setBranchInfo(json.data);
          const existing = getCachedMenu(cacheKey);
          if (existing) {
            setCachedMenu(cacheKey, { ...existing, branchInfo: json.data, ts: Date.now() });
          }
        }
      } catch {
        // ignore — menu render olunmağa davam edir
      }
    };
    loadBranchInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, branchSlug, API_BASE]);

  // Branch-ın öz default görünüşü gələndə tətbiq et (istifadəçi hələ toggle etməyibsə).
  useEffect(() => {
    if (userToggledViewRef.current) return;
    const bv = branchInfo?.branch?.defaultMenuView;
    if (bv === "grid" || bv === "list") setViewMode(bv);
  }, [branchInfo]);

  // Item səhifəsindən qayıdanda saxlanmış scroll pozisiyasını bərpa et.
  useEffect(() => {
    if (status !== "ready" || categories.length === 0) return;
    if (didRestoreScrollRef.current) return;
    didRestoreScrollRef.current = true;
    try {
      const raw = sessionStorage.getItem(scrollKey);
      if (raw === null) return;
      sessionStorage.removeItem(scrollKey);
      const y = Number(raw);
      if (!Number.isFinite(y) || y <= 0) return;
      requestAnimationFrame(() => window.scrollTo(0, y));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, categories]);

  useEffect(() => {
    if (!categories.length) return;
    const handleScroll = () => {
      if (isClickScrollingRef.current) return;
      if (scrollUpdateTimeoutRef.current) clearTimeout(scrollUpdateTimeoutRef.current);
      scrollUpdateTimeoutRef.current = setTimeout(() => {
        scrollUpdateTimeoutRef.current = null;
        if (isClickScrollingRef.current) return;
        const refs = sectionRefs.current;
        let bestId = categories[0]?.id;
        let bestTop = -Infinity;
        for (const cat of categories) {
          const el = refs[cat.id];
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top <= ACTIVE_SECTION_TOP_THRESHOLD && rect.top > bestTop) {
            bestTop = rect.top;
            bestId = cat.id;
          } else if (rect.top > ACTIVE_SECTION_TOP_THRESHOLD && bestTop === -Infinity) {
            bestId = cat.id;
            break;
          }
        }
        setActiveCategoryId((prev) => (prev === bestId ? prev : bestId));
      }, SCROLL_UPDATE_DELAY_MS);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollUpdateTimeoutRef.current) clearTimeout(scrollUpdateTimeoutRef.current);
    };
  }, [categories]);

  useEffect(() => {
    const btn = activeCategoryId ? categoryButtonRefs.current[activeCategoryId] : null;
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeCategoryId]);

  // Axtarış: ad + tərkib (description), bütün 3 dil üzrə; diakritik/hərf fərqinə dözümlü.
  // QEYD: hook-lar erkən return-lardan ƏVVƏL çağırılmalıdır (React #310).
  const displayedCategories = useMemo(() => {
    const tokens = normalizeSearch(search.trim()).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return categories;
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter((it) => {
          const hay = normalizeSearch(
            [
              it.azName,
              it.enName,
              it.ruName,
              it.azDescription,
              it.enDescription,
              it.ruDescription,
              c.azName,
              c.enName,
              c.ruName,
            ]
              .filter(Boolean)
              .join(" ")
          );
          return tokens.every((t) => hay.includes(t));
        }),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, search]);

  const searchActive = search.trim().length > 0;

  if (status === "loading") return <LoadingState message={dict.menu.loading} />;
  if (status === "error") return <ErrorState message={dict.menu.error} />;

  const branding = tenantConfig.branding;
  const branchOverride = branchInfo?.branch ?? null;
  const headerImage = (branchOverride?.photoUrl && getMediaUrl(branchOverride.photoUrl))
    || (branchOverride?.logoUrl && getMediaUrl(branchOverride.logoUrl))
    || (branding?.backgroundImageUrl && getMediaUrl(branding.backgroundImageUrl))
    || (branding?.logoUrl && getMediaUrl(branding.logoUrl))
    || "";
  const displayName = branchOverride?.name ?? tenantConfig.name;

  // Branch tema rəngləri (boşdursa standart stone-50/900-a fallback)
  const pageBg = branchOverride?.backgroundColor || "#fafaf9";
  const pageFg = branchOverride?.foregroundColor || "#1c1917";
  const activePillBg = pageFg;
  const activePillFg = pageBg;
  const addBtnBg = pageFg;
  const addBtnFg = pageBg;

  // 3-dil announcement (locale fallback chain: cari → az → en → ru)
  const announcement =
    (currentLocale === "az" && branchOverride?.announcementAz) ||
    (currentLocale === "ru" && branchOverride?.announcementRu) ||
    (currentLocale === "en" && branchOverride?.announcementEn) ||
    branchOverride?.announcementAz ||
    branchOverride?.announcementEn ||
    branchOverride?.announcementRu ||
    null;

  // Branch sosial linkləri header altında kompakt icon row
  const branchSocialUrls: Array<{ url: string; label: string }> = branchOverride
    ? [
        branchOverride.locationUrl && { url: branchOverride.locationUrl, label: "Maps" },
        branchOverride.wazeLocationUrl && { url: branchOverride.wazeLocationUrl, label: "Waze" },
        branchOverride.instagramUrl && { url: branchOverride.instagramUrl, label: "Instagram" },
        branchOverride.facebookUrl && { url: branchOverride.facebookUrl, label: "Facebook" },
        branchOverride.whatsAppUrl && { url: branchOverride.whatsAppUrl, label: "WhatsApp" },
        branchOverride.telegramUrl && { url: branchOverride.telegramUrl, label: "Telegram" },
        branchOverride.tiktokUrl && { url: branchOverride.tiktokUrl, label: "TikTok" },
        branchOverride.youtubeUrl && { url: branchOverride.youtubeUrl, label: "YouTube" },
        branchOverride.twitterUrl && { url: branchOverride.twitterUrl, label: "Twitter" },
        branchOverride.linkedInUrl && { url: branchOverride.linkedInUrl, label: "LinkedIn" },
        branchOverride.tripAdvisorUrl && { url: branchOverride.tripAdvisorUrl, label: "TripAdvisor" },
        branchOverride.yelpUrl && { url: branchOverride.yelpUrl, label: "Yelp" },
        branchOverride.threadsUrl && { url: branchOverride.threadsUrl, label: "Threads" },
        branchOverride.pinterestUrl && { url: branchOverride.pinterestUrl, label: "Pinterest" },
        branchOverride.websiteUrl && { url: branchOverride.websiteUrl, label: "Website" },
      ].filter((x): x is { url: string; label: string } => !!x)
    : [];

  const isGrid = viewMode === "grid";

  // Map cart items for CheckoutModal (uses string id)
  const checkoutItems = cartItems.map((ci) => ({
    id: String(ci.id),
    name: ci.name,
    price: ci.price,
    currencySign: ci.currencySign,
    quantity: ci.quantity,
    total: ci.total,
  }));

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="sticky top-0 z-10 bg-stone-50 px-4 pb-2 pt-4">
        <RestaurantHeader
          image={headerImage}
          name={displayName}
          rating={0}
          showBack
          onBack={() => router.push(
            branchSlug
              ? `/${locale}/${tenantSlug}/b/${branchSlug}/restaurant`
              : `/${locale}/${tenantSlug}/restaurant`
          )}
        />

        {announcement && (
          <div
            className="mx-1 mt-2 rounded-lg border px-3 py-2 text-xs font-medium"
            style={{
              backgroundColor: pageFg,
              color: pageBg,
              borderColor: pageFg,
              ...(branchOverride?.announcementFontSize
                ? {
                    fontSize: `${branchOverride.announcementFontSize}px`,
                    lineHeight: 1.4,
                  }
                : {}),
            }}
            role="status"
          >
            {announcement}
          </div>
        )}

        {branchSocialUrls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 px-1">
            {branchSocialUrls.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
                aria-label={s.label}
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
        {searchOpen && (
          <div className="mt-2 flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-2">
            <FiSearch className="shrink-0 text-stone-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dict.menu.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  searchInputRef.current?.focus();
                }}
                aria-label="×"
                className="shrink-0 text-stone-400 hover:text-stone-700"
              >
                <FiX className="text-base" />
              </button>
            )}
          </div>
        )}
        <div className="mt-2">
          <div
            ref={categoryPillsRef}
            className="no-scrollbar flex gap-2 overflow-x-auto pb-2"
          >
            {categories.map((category) => (
              <button
                key={category.id}
                ref={(node) => {
                  if (node) categoryButtonRefs.current[category.id] = node;
                }}
                type="button"
                className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium"
                style={
                  activeCategoryId === category.id
                    ? { backgroundColor: activePillBg, color: activePillFg, borderColor: activePillBg }
                    : { backgroundColor: "transparent", color: pageFg, borderColor: pageFg + "33" }
                }
                onClick={() => {
                  isClickScrollingRef.current = true;
                  setActiveCategoryId(category.id);
                  const heading = headingRefs.current[category.id];
                  heading?.scrollIntoView({ behavior: "smooth", block: "start" });
                  setTimeout(() => {
                    isClickScrollingRef.current = false;
                  }, CLICK_SCROLL_COOLDOWN_MS);
                }}
              >
                {getLocalizedName(category, currentLocale)}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 justify-end gap-1">
            <button
              type="button"
              className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                searchOpen
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
              onClick={() => {
                setSearchOpen((open) => {
                  const next = !open;
                  if (!next) setSearch("");
                  else setTimeout(() => searchInputRef.current?.focus(), 0);
                  return next;
                });
              }}
              aria-label={dict.menu.searchPlaceholder}
            >
              <FiSearch className="text-base" />
            </button>
            <button
              type="button"
              className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                viewMode === "list"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
              onClick={() => {
                userToggledViewRef.current = true;
                setViewMode("list");
              }}
              aria-label={dict.menu.listView}
            >
              <FiList className="text-base" />
            </button>
            <button
              type="button"
              className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                viewMode === "grid"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
              onClick={() => {
                userToggledViewRef.current = true;
                setViewMode("grid");
              }}
              aria-label={dict.menu.gridView}
            >
              <FiGrid className="text-base" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        {searchActive && displayedCategories.length === 0 && (
          <p className="mt-8 text-center text-sm text-stone-500">
            {dict.menu.searchEmpty}
          </p>
        )}
        <div className="mt-2 space-y-6">
          {displayedCategories.map((category) => (
            <section
              key={category.id}
              ref={(node) => {
                if (node) sectionRefs.current[category.id] = node;
              }}
            >
              <h2
                ref={(node) => {
                  if (node) headingRefs.current[category.id] = node;
                }}
                className="scroll-mt-48 text-base font-semibold text-stone-900"
              >
                {getLocalizedName(category, currentLocale)}
              </h2>
              <div
                className={`mt-3 ${
                  viewMode === "grid" ? "grid grid-cols-2 gap-3 items-start" : "space-y-3"
                }`}
              >
                {category.items.map((item) => {
                  const itemName = getLocalizedName(item, currentLocale);
                  const itemDesc = getLocalizedDescription(item, currentLocale);
                  const itemImage = item.imageUrls?.[0] || "";
                  const hasDiscount = item.discountPrice > 0;
                  const displayPrice = hasDiscount ? item.discountPrice : item.price;
                  const hasVideo = !!item.ingredientVideoUrl;
                  const itemHref = branchSlug
                    ? `/${locale}/${tenantSlug}/b/${branchSlug}/menu/item/${item.id}`
                    : `/${locale}/${tenantSlug}/menu/item/${item.id}`;

                  const cardClassName = `relative block h-full cursor-pointer rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:shadow-md ${
                    isGrid
                      ? "flex flex-col gap-2"
                      : "flex min-h-[5.5rem] items-center gap-3 pr-24"
                  }`;

                  const imageClassName =
                    viewMode === "grid"
                      ? "h-28 w-full rounded-xl object-cover"
                      : "h-16 w-16 flex-shrink-0 rounded-xl object-cover";

                  const cardBody = (
                    <>
                      {itemImage && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={itemImage}
                          alt={itemName}
                          className={imageClassName}
                        />
                      )}
                      <div className={isGrid ? "flex min-h-0 flex-1 flex-col" : "flex-1"}>
                        {isGrid ? (
                          <h3 className="break-words text-sm font-semibold text-stone-900">
                            {itemName}
                          </h3>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-stone-900">
                              {itemName}
                            </h3>
                          </div>
                        )}
                        {itemDesc && (
                          <p
                            className={`mt-1 text-xs text-stone-600 ${
                              isGrid ? "line-clamp-2 min-h-[34px]" : ""
                            }`}
                          >
                            {itemDesc}
                          </p>
                        )}
                        {item.prepTimeMinutes && item.prepTimeMinutes !== "0" && (
                          <p
                            className={`mt-1 flex items-center gap-1 text-[11px] text-stone-500 ${
                              isGrid ? "mt-auto pt-2" : ""
                            }`}
                          >
                            <FiClock className="text-[11px]" aria-hidden="true" />
                            {dict.menu.prep} {item.prepTimeMinutes} {dict.menu.min}
                          </p>
                        )}
                      </div>
                      {isGrid ? (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-sm font-semibold text-stone-900">
                            {hasDiscount && (
                              <span className="text-xs text-stone-400 line-through">
                                {item.currencySign}{item.price}
                              </span>
                            )}
                            {item.currencySign}{displayPrice}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCart(item);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition hover:scale-105"
                            style={{
                              backgroundColor: lastAdded?.id === item.id ? "#059669" : addBtnBg,
                              color: addBtnFg,
                            }}
                            aria-label={dict.menu.addToCart}
                          >
                            <FiPlus className="text-base" />
                          </button>
                        </div>
                      ) : (
                        <div className="absolute inset-y-3 right-3 flex flex-col items-end justify-between gap-2">
                          <span className="flex items-center gap-1 text-sm font-semibold text-stone-900">
                            {hasDiscount && (
                              <span className="text-xs text-stone-400 line-through">
                                {item.currencySign}{item.price}
                              </span>
                            )}
                            {item.currencySign}{displayPrice}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCart(item);
                            }}
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition hover:scale-105 ${
                              lastAdded?.id === item.id ? "bg-emerald-600" : "bg-stone-900"
                            }`}
                            aria-label={dict.menu.addToCart}
                          >
                            <FiPlus className="text-base" />
                          </button>
                        </div>
                      )}
                    </>
                  );

                  return hasVideo ? (
                    <Link
                      key={item.id}
                      href={itemHref}
                      className={cardClassName}
                      onClick={() => {
                        try {
                          sessionStorage.setItem(scrollKey, String(window.scrollY));
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      {cardBody}
                    </Link>
                  ) : (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setDrawerItem(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setDrawerItem(item);
                        }
                      }}
                      className={`${cardClassName} text-left`}
                    >
                      {cardBody}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {cartTotals.items > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex justify-center px-4">
          <button
            type="button"
            className="pointer-events-auto flex w-full max-w-md items-center justify-between rounded-full bg-stone-900/90 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur"
            onClick={() => setIsCheckoutOpen(true)}
          >
            <span className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
                {cartTotals.items}
              </span>
              <span>{dict.menu.viewOrder}</span>
            </span>
            <span className="text-sm">
              {cartTotals.currencySign}
              {cartTotals.total.toFixed(2)}
            </span>
          </button>
        </div>
      )}

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={checkoutItems}
        total={cartTotals.total}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
      />

      <ItemDetailDrawer
        item={drawerItem}
        open={!!drawerItem}
        onOpenChange={(open) => {
          if (!open) setDrawerItem(null);
        }}
      />

    </div>
  );
}
