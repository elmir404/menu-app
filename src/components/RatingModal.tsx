"use client";

import { useEffect, useMemo, useState } from "react";
import { MdStar, MdStarBorder } from "react-icons/md";
import { useDictionary } from "./providers/LocaleProvider";

const emojis = [
  { value: 1, icon: "\uD83D\uDE1E", label: "Bad" },
  { value: 2, icon: "\uD83D\uDE15", label: "Okay" },
  { value: 3, icon: "\uD83D\uDE42", label: "Good" },
  { value: 4, icon: "\uD83D\uDE0B", label: "Great" },
  { value: 5, icon: "\uD83E\uDD29", label: "Amazing" },
];

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RatingModal({ isOpen, onClose }: RatingModalProps) {
  const dict = useDictionary();
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [isVisible, setIsVisible] = useState(isOpen);

  const activeEmoji = useMemo(
    () => emojis.find((emoji) => emoji.value === rating),
    [rating]
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setIsVisible(true);
    } else {
      timer = setTimeout(() => setIsVisible(false), 220);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isVisible) return null;

  const submitDisabled = rating === 0;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className={`rating-modal-overlay absolute inset-0 bg-black/40 ${
          isOpen ? "is-open" : "is-closed"
        }`}
        onClick={onClose}
        aria-label={dict.restaurant.close}
      />
      <div
        className={`rating-modal-panel absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-6 shadow-2xl ${
          isOpen ? "is-open" : "is-closed"
        }`}
      >
        <div className="mx-auto max-h-[80vh] max-w-md overflow-y-auto pb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-900">
              {dict.restaurant.ratingTitle}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-stone-500"
            >
              {dict.restaurant.close}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-stone-50 px-3 py-2">
            <span className="text-2xl" aria-hidden="true">
              {activeEmoji?.icon || "\uD83D\uDE42"}
            </span>
            <span className="text-sm text-stone-600">
              {activeEmoji?.label || "Select a rating"}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const active = value <= rating;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 bg-white text-xl"
                  aria-label={`Rate ${value} stars`}
                >
                  {active ? (
                    <MdStar className="text-amber-400" />
                  ) : (
                    <MdStarBorder className="text-stone-300" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <label
              htmlFor="rating-name"
              className="text-xs font-medium text-stone-600"
            >
              {dict.restaurant.name}
            </label>
            <input
              id="rating-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={dict.restaurant.yourName}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-400"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="rating-comment"
              className="text-xs font-medium text-stone-600"
            >
              {dict.restaurant.comment}
            </label>
            <textarea
              id="rating-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={dict.restaurant.commentPlaceholder}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-400"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold ${
              submitDisabled
                ? "bg-stone-200 text-stone-500"
                : "bg-stone-900 text-white"
            }`}
            disabled={submitDisabled}
          >
            {dict.restaurant.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
