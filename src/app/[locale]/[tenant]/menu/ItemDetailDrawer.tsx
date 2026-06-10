"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { FiClock, FiMinus, FiPlus } from "react-icons/fi";
import type { PublicMenuItem } from "@/types/api";
import { useDictionary, useLocale } from "@/components/providers/LocaleProvider";
import { getLocalizedName, getLocalizedDescription } from "@/lib/i18n-helpers";
import { useCart } from "@/hooks/use-cart";

interface Props {
  item: PublicMenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ItemDetailDrawer({ item, open, onOpenChange }: Props) {
  const dict = useDictionary();
  const currentLocale = useLocale();
  const { items: cartItems, add, increment, decrement } = useCart();
  const [modalQuantity, setModalQuantity] = useState(1);

  if (!item) return null;

  const name = getLocalizedName(item, currentLocale);
  const description = getLocalizedDescription(item, currentLocale);
  const hasDiscount = item.discountPrice > 0;
  const displayPrice = hasDiscount ? item.discountPrice : item.price;
  const imageUrl = item.imageUrls?.[0] ?? "";
  const cartItem = cartItems.find((ci) => ci.id === item.id);
  const inCartQuantity = cartItem?.quantity ?? 0;

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
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-2xl outline-none"
        >
          <div className="mx-auto mt-3 h-1.5 w-12 flex-shrink-0 cursor-grab rounded-full bg-stone-300 active:cursor-grabbing" />

          <Drawer.Title className="sr-only">{name}</Drawer.Title>

          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
            {imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt={name}
                className="mb-4 h-56 w-full rounded-xl object-cover"
              />
            )}

            <h1 className="text-2xl font-bold text-stone-900">{name}</h1>
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
