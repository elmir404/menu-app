"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useDictionary } from "@/components/providers/LocaleProvider";
import type { PublicMenuPopup } from "@/types/api";

interface CampaignPopupProps {
  tenantSlug: string;
  locale: string;
  /** Filial menyusu (/b/{slug}/menu) — backend həmin filiala aid popup-ları seçir; null = ümumi menyu */
  branchSlug?: string | null;
}

/** Bir neçə popup varsa slaydlar bu müddətdən bir avtomatik dəyişir */
const AUTO_ADVANCE_MS = 5000;
/** Barmaqla sürüşdürmə həddi (px) */
const SWIPE_THRESHOLD = 40;

function pickLocalized(
  locale: string,
  az?: string | null,
  en?: string | null,
  ru?: string | null
): string {
  const by: Record<string, string | null | undefined> = { az, en, ru };
  const preferred = by[locale];
  if (preferred && preferred.trim()) return preferred.trim();
  for (const v of [az, en, ru]) {
    if (v && v.trim()) return v.trim();
  }
  return "";
}

function hasContent(p: PublicMenuPopup, locale: string): boolean {
  return !!((p.imageUrl && p.imageUrl.trim()) || pickLocalized(locale, p.azTitle, p.enTitle, p.ruTitle));
}

/**
 * QR menyu açılanda göstərilən kampaniya popup-u.
 * Tam dinamik: yalnız-şəkil rejimi, mətnli rejim, opsional CTA (loyallıq keçidi).
 * Bir neçə aktiv popup → eyni pəncərədə slayd (avtomatik dəyişir, sürüşdürmə, nöqtələr).
 * Sessiyada bir dəfə göstərilir.
 */
export default function CampaignPopup({ tenantSlug, locale, branchSlug }: CampaignPopupProps) {
  const dict = useDictionary();
  const [popups, setPopups] = useState<PublicMenuPopup[]>([]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  // İstifadəçi əl ilə dəyişəndə avtomatik taymer yenidən başlasın
  const [interaction, setInteraction] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
  // Filial üzrə ayrıca — bir filialın popup-u digər filialınkını gizlətməsin
  const shownKey = `menu-popup-shown:${tenantSlug}${branchSlug ? `:${branchSlug}` : ""}`;

  useEffect(() => {
    if (!tenantSlug) return;
    try {
      if (sessionStorage.getItem(shownKey)) return;
    } catch {
      // sessionStorage əlçatmazsa yenə göstər
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const query = branchSlug ? `?branch=${encodeURIComponent(branchSlug)}` : "";
        const res = await fetch(`${API_BASE}/api/public/menu-popups/${tenantSlug}${query}`);
        if (!res.ok) return;
        const json = (await res.json()) as { success?: boolean; data?: PublicMenuPopup[] | null };
        if (cancelled || !json?.success || !Array.isArray(json.data)) return;
        const list = json.data.filter((p) => hasContent(p, locale));
        if (list.length === 0) return;
        setPopups(list);
        setIndex(0);
        setOpen(true);
        try {
          sessionStorage.setItem(shownKey, "1");
        } catch {
          // ignore
        }
      } catch {
        // popup çıxmasa menyu işləməyə davam edir
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, branchSlug]);

  const count = popups.length;

  const goTo = useCallback(
    (i: number) => {
      if (count === 0) return;
      setIndex(((i % count) + count) % count);
      setInteraction((n) => n + 1);
    },
    [count]
  );

  // Avtomatik dəyişmə — yalnız açıqkən və 2+ slayd olanda
  useEffect(() => {
    if (!open || count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTO_ADVANCE_MS);
    return () => clearInterval(t);
  }, [open, count, interaction]);

  if (count === 0) return null;

  const current = popups[index];
  const currentTitle = pickLocalized(locale, current.azTitle, current.enTitle, current.ruTitle);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl outline-none duration-200"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            {currentTitle || dict.campaign.goToLoyalty}
          </DialogPrimitive.Title>

          {/* Bağlama X */}
          <DialogPrimitive.Close
            className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
            aria-label={dict.restaurant.close}
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>

          {/* Slaydlar: yan-yana, hündürlük ən uzun slayda bərabər (flex stretch) */}
          <div
            className="overflow-hidden"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const start = touchStartX.current;
              touchStartX.current = null;
              if (start == null || count < 2) return;
              const dx = (e.changedTouches[0]?.clientX ?? start) - start;
              if (Math.abs(dx) >= SWIPE_THRESHOLD) goTo(index + (dx < 0 ? 1 : -1));
            }}
          >
            <div
              className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {popups.map((p, i) => (
                <PopupSlide key={i} popup={p} locale={locale} active={i === index} />
              ))}
            </div>
          </div>

          {count > 1 && (
            <div className="flex justify-center gap-1.5 pt-3">
              {popups.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${i + 1} / ${count}`}
                  aria-current={i === index}
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-5" : "w-1.5 bg-stone-300"}`}
                  style={i === index ? { backgroundColor: "var(--brand-primary, #7C3AED)" } : undefined}
                />
              ))}
            </div>
          )}

          <div className="px-5 pt-3 pb-5">
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
              >
                {dict.restaurant.close}
              </button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PopupSlide({ popup, locale, active }: { popup: PublicMenuPopup; locale: string; active: boolean }) {
  const dict = useDictionary();
  const title = pickLocalized(locale, popup.azTitle, popup.enTitle, popup.ruTitle);
  const description = pickLocalized(locale, popup.azDescription, popup.enDescription, popup.ruDescription);
  const ctaText =
    pickLocalized(locale, popup.azCtaText, popup.enCtaText, popup.ruCtaText) || dict.campaign.goToLoyalty;
  const imageOnly = !!popup.imageUrl && !title && !description;

  return (
    <div className="flex w-full shrink-0 flex-col" aria-hidden={!active}>
      {popup.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={popup.imageUrl}
          alt={title || ""}
          className={imageOnly ? "max-h-[70vh] w-full object-cover" : "max-h-[40vh] w-full object-cover"}
        />
      )}

      {(title || description) && (
        <div className="space-y-2 px-5 pt-4">
          {title && <h2 className="text-lg font-bold leading-tight text-stone-900">{title}</h2>}
          {description && <p className="text-sm leading-relaxed text-stone-600">{description}</p>}
        </div>
      )}

      {popup.ctaEnabled && popup.ctaUrl && (
        <div className="mt-auto px-5 pt-4">
          <button
            type="button"
            tabIndex={active ? 0 : -1}
            onClick={() => {
              if (popup.ctaUrl) window.location.href = popup.ctaUrl;
            }}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md transition-transform active:scale-[0.98]"
            style={{ backgroundColor: "var(--brand-primary, #7C3AED)" }}
          >
            {ctaText}
          </button>
        </div>
      )}
    </div>
  );
}
