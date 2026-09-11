"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useDictionary } from "@/components/providers/LocaleProvider";
import type { PublicMenuPopup } from "@/types/api";

interface CampaignPopupProps {
  tenantSlug: string;
  locale: string;
}

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

/**
 * QR menyu açılanda göstərilən kampaniya popup-u.
 * Tam dinamik: yalnız-şəkil rejimi, mətnli rejim, opsional CTA (loyallıq keçidi).
 * Sessiyada bir dəfə göstərilir.
 */
export default function CampaignPopup({ tenantSlug, locale }: CampaignPopupProps) {
  const dict = useDictionary();
  const [popup, setPopup] = useState<PublicMenuPopup | null>(null);
  const [open, setOpen] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
  const shownKey = `menu-popup-shown:${tenantSlug}`;

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
        const res = await fetch(`${API_BASE}/api/public/menu-popup/${tenantSlug}`);
        if (!res.ok) return;
        const json = (await res.json()) as { success?: boolean; data?: PublicMenuPopup | null };
        if (cancelled || !json?.success || !json.data) return;
        const hasAnything =
          (json.data.imageUrl && json.data.imageUrl.trim()) ||
          pickLocalized(locale, json.data.azTitle, json.data.enTitle, json.data.ruTitle);
        if (!hasAnything) return;
        setPopup(json.data);
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
  }, [tenantSlug]);

  if (!popup) return null;

  const title = pickLocalized(locale, popup.azTitle, popup.enTitle, popup.ruTitle);
  const description = pickLocalized(
    locale,
    popup.azDescription,
    popup.enDescription,
    popup.ruDescription
  );
  const ctaText =
    pickLocalized(locale, popup.azCtaText, popup.enCtaText, popup.ruCtaText) ||
    dict.campaign.goToLoyalty;
  const imageOnly = !!popup.imageUrl && !title && !description;

  const handleCta = () => {
    if (popup.ctaUrl) window.location.href = popup.ctaUrl;
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl outline-none duration-200"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            {title || dict.campaign.goToLoyalty}
          </DialogPrimitive.Title>

          {/* Bağlama X */}
          <DialogPrimitive.Close
            className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
            aria-label={dict.restaurant.close}
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>

          {popup.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={popup.imageUrl}
              alt={title || ""}
              className={
                imageOnly
                  ? "max-h-[70vh] w-full object-cover"
                  : "max-h-[40vh] w-full object-cover"
              }
            />
          )}

          {(title || description) && (
            <div className="space-y-2 px-5 pt-4">
              {title && (
                <h2 className="text-lg font-bold leading-tight text-stone-900">{title}</h2>
              )}
              {description && (
                <p className="text-sm leading-relaxed text-stone-600">{description}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 p-5">
            {popup.ctaEnabled && popup.ctaUrl && (
              <button
                type="button"
                onClick={handleCta}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md transition-transform active:scale-[0.98]"
                style={{ backgroundColor: "var(--brand-primary, #7C3AED)" }}
              >
                {ctaText}
              </button>
            )}
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
