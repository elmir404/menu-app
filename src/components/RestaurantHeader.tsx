"use client";

import { FiChevronLeft } from "react-icons/fi";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface RestaurantHeaderProps {
  image: string;
  name: string;
  rating: number;
  showBack?: boolean;
  onBack?: () => void;
}

export default function RestaurantHeader({
  image,
  name,
  rating,
  showBack,
  onBack,
}: RestaurantHeaderProps) {
  return (
    <header className="rounded-xl bg-white p-3 shadow-md sm:rounded-2xl sm:p-4">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 sm:h-9 sm:w-9"
              aria-label="Go back"
            >
              <FiChevronLeft className="text-sm sm:text-base" />
            </button>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={name}
            className="h-12 w-12 flex-shrink-0 rounded-lg object-cover sm:h-16 sm:w-16"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-stone-900 sm:text-lg">{name}</h1>
            {/* <div className="mt-1 flex items-center gap-1 text-sm text-stone-700">
              <FiStar
                className="text-sm text-amber-500 shrink-0"
                aria-hidden="true"
              />
              <span>{rating}</span>
            </div> */}
          </div>
        </div>
        <div className="shrink-0 scale-90 sm:scale-100 origin-right">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
