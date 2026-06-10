"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiClock, FiMinus, FiPlus } from "react-icons/fi";
import type { PublicMenuItem } from "@/types/api";
import { useDictionary, useLocale } from "@/components/providers/LocaleProvider";
import { getLocalizedName, getLocalizedDescription } from "@/lib/i18n-helpers";
import { useCart } from "@/hooks/use-cart";

interface Props {
  locale: string;
  tenantSlug: string;
  branchSlug?: string;
  item: PublicMenuItem;
}

// Drawer geometry: drawer is fixed at bottom with h-[50vh].
// translateY(0vh) -> drawer covers bottom 50% (HALF state).
// translateY(40vh) -> drawer is at bottom 10% (PEEK state).
// progress 0..1 maps to translateY 0..40vh and to video.currentTime 0..duration.
const TRANSLATE_RANGE_VH = 40;

export default function ItemDetailClient({
  locale,
  tenantSlug,
  branchSlug,
  item,
}: Props) {
  const dict = useDictionary();
  const currentLocale = useLocale();
  const { items: cartItems, totals, add, increment, decrement } = useCart();
  const [modalQuantity, setModalQuantity] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [rewinding, setRewinding] = useState(false);
  const rewindRafRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartProgressRef = useRef(0);

  const name = getLocalizedName(item, currentLocale);
  const description = getLocalizedDescription(item, currentLocale);
  const hasDiscount = item.discountPrice > 0;
  const displayPrice = hasDiscount ? item.discountPrice : item.price;
  const imageUrl = item.imageUrls?.[0] ?? "";
  const hasVideo = !!item.ingredientVideoUrl;

  const cartItem = mounted ? cartItems.find((ci) => ci.id === item.id) : undefined;
  const inCartQuantity = cartItem?.quantity ?? 0;

  const backHref = branchSlug
    ? `/${locale}/${tenantSlug}/b/${branchSlug}/menu`
    : `/${locale}/${tenantSlug}/menu`;

  const handleAdd = () => {
    add(
      {
        id: item.id,
        name,
        price: displayPrice,
        currencySign: item.currencySign || "₼",
      },
      modalQuantity
    );
    setModalQuantity(1);
  };

  const applyProgress = (p: number) => {
    const clamped = Math.max(0, Math.min(1, p));
    progressRef.current = clamped;
    const el = drawerRef.current;
    if (el) {
      el.style.transform = `translateY(${clamped * TRANSLATE_RANGE_VH}vh)`;
    }
  };

  // Initial drawer position (set imperatively so React re-renders don't override transform).
  useEffect(() => {
    applyProgress(0);
  }, []);

  // RAF loop: while video is playing and user is not dragging,
  // drive drawer position from video.currentTime.
  useEffect(() => {
    if (!hasVideo) return;
    const video = videoRef.current;
    if (!video) return;

    const tick = () => {
      if (!isDraggingRef.current) {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        if (duration > 0 && !video.paused && !video.ended) {
          applyProgress(video.currentTime / duration);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [hasVideo]);

  const handleVideoTap = () => {
    const video = videoRef.current;
    if (!video) return;
    if (rewindRafRef.current !== null) {
      cancelAnimationFrame(rewindRafRef.current);
      rewindRafRef.current = null;
    }
    if (video.paused || video.ended) {
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => { /* autoplay blocked */ });
      }
    } else {
      video.pause();
    }
  };

  const handlePlayClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (rewindRafRef.current !== null) {
      cancelAnimationFrame(rewindRafRef.current);
      rewindRafRef.current = null;
    }
    const p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => { /* autoplay blocked */ });
    }
  };

  const handleRewind = () => {
    const video = videoRef.current;
    if (!video) return;
    if (rewindRafRef.current !== null) {
      cancelAnimationFrame(rewindRafRef.current);
      rewindRafRef.current = null;
    }
    try { video.pause(); } catch { /* ignore */ }
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (duration <= 0) {
      applyProgress(0);
      setEnded(false);
      setRewinding(false);
      return;
    }
    setRewinding(true);
    const startTime = video.currentTime;
    const t0 = performance.now();
    const step = () => {
      const elapsed = (performance.now() - t0) / 1000;
      const newTime = Math.max(0, startTime - elapsed);
      applyProgress(newTime / duration);
      try { video.currentTime = newTime; } catch { /* ignore */ }
      if (newTime > 0) {
        rewindRafRef.current = requestAnimationFrame(step);
      } else {
        rewindRafRef.current = null;
        setRewinding(false);
        setEnded(false);
      }
    };
    rewindRafRef.current = requestAnimationFrame(step);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (video && !video.paused) {
      try { video.pause(); } catch { /* ignore */ }
    }
    setEnded(false);
    setRewinding(false);
    if (rewindRafRef.current !== null) {
      cancelAnimationFrame(rewindRafRef.current);
      rewindRafRef.current = null;
    }
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartProgressRef.current = progressRef.current;
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch { /* ignore */ }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const vh = window.innerHeight || 1;
    const deltaY = e.clientY - dragStartYRef.current;
    const deltaProgress = (deltaY / vh) * (100 / TRANSLATE_RANGE_VH);
    const next = Math.max(0, Math.min(1, dragStartProgressRef.current + deltaProgress));
    applyProgress(next);
    const video = videoRef.current;
    if (video) {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (duration > 0) {
        const target = next * duration;
        if (Math.abs(target - video.currentTime) > 0.02) {
          try { video.currentTime = target; } catch { /* ignore */ }
        }
      }
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch { /* ignore */ }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Video — full screen bg; tap to play/pause */}
      {hasVideo && (
        <video
          ref={videoRef}
          src={item.ingredientVideoUrl!}
          poster={imageUrl || undefined}
          muted
          playsInline
          preload="auto"
          onClick={handleVideoTap}
          onPlay={() => { setPlaying(true); setEnded(false); }}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setEnded(true); }}
          onError={(e) => {
            const v = e.currentTarget as HTMLVideoElement | null;
            console.error("[ItemDetail] video load error:", {
              src: v?.src,
              error: v?.error,
              networkState: v?.networkState,
              readyState: v?.readyState,
            });
          }}
          className="fixed inset-0 z-10 h-screen w-screen cursor-pointer bg-black object-contain"
        />
      )}

      {/* Image — only when no video */}
      {!hasVideo && imageUrl && (
        <div className="fixed inset-x-0 top-0 z-10 h-[50vh] overflow-hidden bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-contain object-top"
          />
        </div>
      )}

      {/* Sticky back button */}
      <Link
        href={backHref}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-md backdrop-blur transition hover:bg-white"
        aria-label="Geri"
      >
        <FiArrowLeft className="text-xl" />
      </Link>

      {/* Custom controlled drawer */}
      <div
        ref={drawerRef}
        className="fixed inset-x-0 bottom-0 z-40 flex h-[50vh] flex-col rounded-t-3xl bg-white shadow-2xl"
        style={{ transition: "transform 80ms linear", touchAction: "none" }}
      >
        <div
          className="mx-auto mt-3 h-1.5 w-12 flex-shrink-0 cursor-grab touch-none rounded-full bg-stone-300 active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />

        <h1 className="sr-only">{name}</h1>

        {hasVideo && !playing && !ended && !rewinding && (
          <div className="flex justify-center px-6 pt-3">
            <button
              type="button"
              onClick={handlePlayClick}
              className="text-sm font-semibold text-stone-900 underline underline-offset-4 decoration-stone-900 transition hover:opacity-70"
            >
              {dict.menu.viewIngredients}
            </button>
          </div>
        )}

        {hasVideo && ended && !rewinding && (
          <div className="flex justify-center px-6 pt-3">
            <button
              type="button"
              onClick={handleRewind}
              className="text-sm font-semibold text-stone-900 underline underline-offset-4 decoration-stone-900 transition hover:opacity-70"
            >
              {dict.menu.scrollUp}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 pb-32">
          <h2 className="text-2xl font-bold text-stone-900">{name}</h2>
          {description && (
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              {description}
            </p>
          )}

          <div className="mt-5 flex items-center justify-between rounded-lg bg-stone-50 p-4">
            {item.prepTimeMinutes && item.prepTimeMinutes !== "0" ? (
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <FiClock className="text-sm" />
                <span>
                  {dict.menu.prep} {item.prepTimeMinutes} {dict.menu.min}
                </span>
              </div>
            ) : (
              <span />
            )}
            <div className="text-right">
              {hasDiscount && (
                <p className="text-xs text-stone-400 line-through">
                  {item.currencySign}
                  {item.price}
                </p>
              )}
              <p className="text-2xl font-bold text-stone-900">
                {item.currencySign}
                {displayPrice}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex flex-1 items-center justify-between rounded-full border border-stone-200 bg-white px-3 py-2">
              <button
                type="button"
                onClick={() =>
                  inCartQuantity > 0
                    ? decrement(item.id)
                    : setModalQuantity((p) => Math.max(1, p - 1))
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-stone-50"
                aria-label={dict.menu.decrease}
              >
                <FiMinus />
              </button>
              <span className="min-w-[40px] text-center text-base font-semibold text-stone-900">
                {inCartQuantity > 0 ? inCartQuantity : modalQuantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  inCartQuantity > 0
                    ? increment(item.id)
                    : setModalQuantity((p) => p + 1)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-stone-50"
                aria-label={dict.menu.increase}
              >
                <FiPlus />
              </button>
            </div>
            {inCartQuantity === 0 && (
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02]"
              >
                {dict.menu.addToCart}
              </button>
            )}
          </div>
        </div>

        {mounted && totals.items > 0 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center px-4">
            <Link
              href={backHref}
              className="flex w-full max-w-md items-center justify-between rounded-full bg-stone-900/90 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur"
            >
              <span className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
                  {totals.items}
                </span>
                <span>{dict.menu.viewOrder}</span>
              </span>
              <span className="text-sm">
                {totals.currencySign}
                {totals.total.toFixed(2)}
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
