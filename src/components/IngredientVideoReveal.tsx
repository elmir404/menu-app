"use client";

import { useState, useRef } from "react";
import { FiPlay } from "react-icons/fi";

interface IngredientVideoRevealProps {
  imageUrl: string;
  videoUrl: string;
  alt: string;
  buttonLabel: string;
}

export function IngredientVideoReveal({
  imageUrl,
  videoUrl,
  alt,
  buttonLabel,
}: IngredientVideoRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleClick = () => {
    setRevealed(true);
    setTimeout(() => {
      videoRef.current?.play().catch(() => {
        /* autoplay blocked — user can use controls */
      });
    }, 50);
  };

  return (
    <div className="relative w-full">
      <div className="relative h-[300px] w-full overflow-hidden sm:h-[400px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            revealed ? "opacity-0" : "opacity-100"
          }`}
        />
        <video
          ref={videoRef}
          src={videoUrl}
          poster={imageUrl}
          muted
          playsInline
          loop
          preload="metadata"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            revealed ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
      {!revealed && (
        <button
          type="button"
          onClick={handleClick}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-stone-900/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:scale-105"
        >
          <FiPlay className="text-base" />
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
