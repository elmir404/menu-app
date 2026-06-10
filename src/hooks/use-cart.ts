"use client";

import { useEffect, useState, useCallback } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  currencySign: string;
  quantity: number;
  total: number;
}

const STORAGE_KEY = "menu-cart-v1";

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => readStorage());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }, []);

  const add = useCallback(
    (item: Omit<CartItem, "quantity" | "total">, quantity: number = 1) => {
      const next = readStorage();
      const existing = next.find((i) => i.id === item.id);
      let result: CartItem[];
      if (existing) {
        result = next.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: i.quantity + quantity,
                total: (i.quantity + quantity) * i.price,
              }
            : i
        );
      } else {
        result = [...next, { ...item, quantity, total: item.price * quantity }];
      }
      persist(result);
    },
    [persist]
  );

  const increment = useCallback(
    (id: number) => {
      const next = readStorage().map((i) =>
        i.id === id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
          : i
      );
      persist(next);
    },
    [persist]
  );

  const decrement = useCallback(
    (id: number) => {
      const next = readStorage()
        .map((i) =>
          i.id === id
            ? { ...i, quantity: i.quantity - 1, total: (i.quantity - 1) * i.price }
            : i
        )
        .filter((i) => i.quantity > 0);
      persist(next);
    },
    [persist]
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  const totals = items.reduce(
    (acc, item) => {
      acc.items += item.quantity || 0;
      acc.total += item.total || 0;
      acc.currencySign = item.currencySign || acc.currencySign;
      return acc;
    },
    { items: 0, total: 0, currencySign: "₼" }
  );

  return { items, totals, add, increment, decrement, clear };
}
