"use client";

import { useEffect, useState } from "react";

interface BannerSlideshowProps {
  images: string[];
  intervalMs?: number;
  className?: string;
}

/**
 * CSS-only auto-cycling carousel. translateX(-{index*100}%) tipli.
 * Heç bir kənar paket istifadə olunmur — köhnə browser-larda da işləyir.
 */
export function BannerSlideshow({
  images,
  intervalMs = 4000,
  className = "",
}: BannerSlideshowProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      intervalMs
    );
    return () => window.clearInterval(id);
  }, [images.length, intervalMs]);

  if (images.length === 0) return null;

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={i}
            src={src}
            alt=""
            className="h-full w-full flex-shrink-0 object-cover"
            draggable={false}
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
