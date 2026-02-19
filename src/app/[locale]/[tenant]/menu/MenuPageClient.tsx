"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiClock, FiGrid, FiList, FiMinus, FiPlus } from "react-icons/fi";
import RestaurantHeader from "@/components/RestaurantHeader";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import CheckoutModal from "@/components/CheckoutModal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDictionary } from "@/components/providers/LocaleProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useTenant } from "@/components/providers/TenantProvider";
import type { PublicMenuCategory, PublicMenuItem } from "@/types/api";
import { getMediaUrl } from "@/lib/api/client";

const SCROLL_UPDATE_DELAY_MS = 150;
const CLICK_SCROLL_COOLDOWN_MS = 600;
const ACTIVE_SECTION_TOP_THRESHOLD = 200;

interface CartItem {
  id: number;
  name: string;
  price: number;
  currencySign: string;
  quantity: number;
  total: number;
}

interface MenuPageClientProps {
  locale: string;
  tenantSlug: string;
}

function getLocalizedName(
  item: { azName: string; enName: string; ruName: string },
  locale: string
): string {
  switch (locale) {
    case "en":
      return item.enName || item.azName;
    case "ru":
      return item.ruName || item.azName;
    default:
      return item.azName;
  }
}

function getLocalizedDescription(
  item: {
    azDescription: string | null;
    enDescription: string | null;
    ruDescription: string | null;
  },
  locale: string
): string {
  switch (locale) {
    case "en":
      return item.enDescription || item.azDescription || "";
    case "ru":
      return item.ruDescription || item.azDescription || "";
    default:
      return item.azDescription || "";
  }
}

export default function MenuPageClient({
  locale,
  tenantSlug,
}: MenuPageClientProps) {
  const router = useRouter();
  const dict = useDictionary();
  const currentLocale = useLocale();
  const tenantConfig = useTenant();

  const [categories, setCategories] = useState<PublicMenuCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const sectionRefs = useRef<Record<number, HTMLElement>>({});
  const headingRefs = useRef<Record<number, HTMLElement>>({});
  const categoryPillsRef = useRef<HTMLDivElement>(null);
  const categoryButtonRefs = useRef<Record<number, HTMLButtonElement>>({});
  const isClickScrollingRef = useRef(false);
  const scrollUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [lastAdded, setLastAdded] = useState<{ id: number; ts: number } | null>(null);
  const lastAddedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  const cartTotals = cartItems.reduce(
    (acc, item) => {
      acc.items += item.quantity || 0;
      acc.total += item.total || 0;
      acc.currencySign = item.currencySign || acc.currencySign;
      return acc;
    },
    { items: 0, total: 0, currencySign: "\u20BC" }
  );

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
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * i.price }
            : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name,
          price: item.discountPrice > 0 ? item.discountPrice : item.price,
          currencySign: item.currencySign || "\u20BC",
          quantity,
          total: (item.discountPrice > 0 ? item.discountPrice : item.price) * quantity,
        },
      ];
    });
    if (lastAddedTimeoutRef.current) clearTimeout(lastAddedTimeoutRef.current);
    setLastAdded({ id: item.id, ts: Date.now() });
    playBeep();
    lastAddedTimeoutRef.current = setTimeout(() => setLastAdded(null), 1000);
  };

  const handleIncrement = (id: string) => {
    const numId = Number(id);
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === numId
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      )
    );
  };

  const handleDecrement = (id: string) => {
    const numId = Number(id);
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === numId
            ? { ...item, quantity: item.quantity - 1, total: (item.quantity - 1) * item.price }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/public/menu/${tenantSlug}`);
        if (!res.ok) throw new Error("Failed to load menu");
        const json = await res.json();
        if (json.success && json.data) {
          setCategories(json.data);
          setActiveCategoryId(json.data[0]?.id || 0);
        }
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    };
    loadMenu();
  }, [tenantSlug, API_BASE]);

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

  if (status === "loading") return <LoadingState message={dict.menu.loading} />;
  if (status === "error") return <ErrorState message={dict.menu.error} />;

  const branding = tenantConfig.branding;
  const headerImage = branding?.backgroundImageUrl
    ? getMediaUrl(branding.backgroundImageUrl)
    : branding?.logoUrl
      ? getMediaUrl(branding.logoUrl)
      : "";

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
          name={tenantConfig.name}
          rating={0}
          showBack
          onBack={() => router.push(`/${locale}/${tenantSlug}/restaurant`)}
        />
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
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${
                  activeCategoryId === category.id
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-white text-stone-700"
                }`}
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
                viewMode === "list"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
              onClick={() => setViewMode("list")}
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
              onClick={() => setViewMode("grid")}
              aria-label={dict.menu.gridView}
            >
              <FiGrid className="text-base" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        <div className="mt-2 space-y-6">
          {categories.map((category) => (
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
                  viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"
                }`}
              >
                {category.items.map((item) => {
                  const itemName = getLocalizedName(item, currentLocale);
                  const itemDesc = getLocalizedDescription(item, currentLocale);
                  const itemImage = item.imageUrls?.[0] || "";
                  const hasDiscount = item.discountPrice > 0;
                  const displayPrice = hasDiscount ? item.discountPrice : item.price;

                  return (
                    <article
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`relative h-full cursor-pointer rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:shadow-md ${
                        isGrid
                          ? "flex flex-col gap-2"
                          : "flex items-center gap-3 pr-24"
                      }`}
                    >
                      {itemImage && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={itemImage}
                          alt={itemName}
                          className={
                            viewMode === "grid"
                              ? "h-28 w-full rounded-xl object-cover"
                              : "h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                          }
                        />
                      )}
                      <div className={isGrid ? "flex min-h-0 flex-1 flex-col" : "flex-1"}>
                        <div
                          className={`flex items-start ${
                            isGrid
                              ? "justify-between gap-2"
                              : "items-center justify-between gap-2"
                          }`}
                        >
                          <h3
                            className={`text-sm font-semibold text-stone-900 ${
                              isGrid ? "line-clamp-1 min-h-[20px]" : ""
                            }`}
                          >
                            {itemName}
                          </h3>
                          {isGrid && (
                            <span className="flex items-center gap-1 text-sm font-semibold text-stone-900">
                              {hasDiscount && (
                                <span className="text-xs text-stone-400 line-through">
                                  {item.currencySign}{item.price}
                                </span>
                              )}
                              {item.currencySign}{displayPrice}
                            </span>
                          )}
                        </div>
                        {itemDesc && (
                          <p
                            className={`mt-1 text-xs text-stone-600 ${
                              isGrid ? "line-clamp-2 min-h-[34px]" : ""
                            }`}
                          >
                            {itemDesc}
                          </p>
                        )}
                        <p
                          className={`mt-1 flex items-center gap-1 text-[11px] text-stone-500 ${
                            isGrid ? "mt-auto pt-2" : ""
                          }`}
                        >
                          <FiClock className="text-[11px]" aria-hidden="true" />
                          {dict.menu.prep} {item.prepTimeMinutes} {dict.menu.min}
                        </p>
                      </div>
                      {isGrid ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                          className={`absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition hover:scale-105 ${
                            lastAdded?.id === item.id ? "bg-emerald-600" : "bg-stone-900"
                          }`}
                          aria-label={dict.menu.addToCart}
                        >
                          <FiPlus className="text-base" />
                        </button>
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
                    </article>
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

      {/* Menu Item Detail Bottom Sheet */}
      <Sheet 
        open={selectedItem !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
            setModalQuantity(1); // Reset quantity when closing
          }
        }}
      >
        <SheetContent 
          side="bottom" 
          className="max-h-[90vh] overflow-y-auto p-0 rounded-t-3xl"
          showCloseButton={true}
        >
          {selectedItem && (
            <>
              {/* Şəkil */}
              {selectedItem.imageUrls?.[0] && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedItem.imageUrls[0]}
                  alt={getLocalizedName(selectedItem, currentLocale)}
                  className="h-[300px] w-full object-cover sm:h-[400px]"
                />
              )}
              
              {/* Məzmun */}
              <SheetHeader className="px-6 pt-4">
                <SheetTitle className="text-xl font-bold text-stone-900">
                  {getLocalizedName(selectedItem, currentLocale)}
                </SheetTitle>
                {getLocalizedDescription(selectedItem, currentLocale) && (
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {getLocalizedDescription(selectedItem, currentLocale)}
                  </p>
                )}
              </SheetHeader>

              {/* Qiymət və müddət */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between rounded-lg bg-stone-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <FiClock className="text-sm" />
                    <span>
                      {dict.menu.prep} {selectedItem.prepTimeMinutes} {dict.menu.min}
                    </span>
                  </div>
                  <div className="text-right">
                    {selectedItem.discountPrice > 0 && (
                      <p className="text-xs text-stone-400 line-through">
                        {selectedItem.currencySign}{selectedItem.price}
                      </p>
                    )}
                    <p className="text-lg font-bold text-stone-900">
                      {selectedItem.currencySign}
                      {selectedItem.discountPrice > 0
                        ? selectedItem.discountPrice
                        : selectedItem.price}
                    </p>
                  </div>
                </div>

                {/* Miqdar və əlavə et */}
                {(() => {
                  const cartItem = cartItems.find((ci) => ci.id === selectedItem.id);
                  const quantity = cartItem?.quantity || 0;

                  if (quantity > 0) {
                    // Artıq səbətdədir - miqdar artırma/azaltma
                    return (
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex flex-1 items-center justify-between rounded-full border border-stone-200 bg-white px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleDecrement(String(selectedItem.id))}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-stone-50"
                            aria-label={dict.menu.decrease}
                          >
                            <FiMinus className="text-sm" />
                          </button>
                          <span className="min-w-[40px] text-center text-base font-semibold text-stone-900">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrement(String(selectedItem.id))}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-stone-50"
                            aria-label={dict.menu.increase}
                          >
                            <FiPlus className="text-sm" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedItem(null)}
                          className="rounded-full border border-stone-200 bg-white px-6 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                        >
                          {dict.menu.viewOrder || "Səbətə bax"}
                        </button>
                      </div>
                    );
                  } else {
                    // Səbətdə yoxdur - counter və əlavə edin düyməsi
                    return (
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex flex-1 items-center justify-between rounded-full border border-stone-200 bg-white px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setModalQuantity((prev) => Math.max(1, prev - 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-stone-50"
                            aria-label={dict.menu.decrease}
                          >
                            <FiMinus className="text-sm" />
                          </button>
                          <span className="min-w-[40px] text-center text-base font-semibold text-stone-900">
                            {modalQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setModalQuantity((prev) => prev + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-stone-50"
                            aria-label={dict.menu.increase}
                          >
                            <FiPlus className="text-sm" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleAddToCart(selectedItem, modalQuantity);
                            setSelectedItem(null);
                            setModalQuantity(1); // Reset quantity
                          }}
                          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] ${
                            lastAdded?.id === selectedItem.id ? "bg-emerald-600" : "bg-stone-900"
                          }`}
                        >
                          {dict.menu.addToCart}
                        </button>
                      </div>
                    );
                  }
                })()}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
