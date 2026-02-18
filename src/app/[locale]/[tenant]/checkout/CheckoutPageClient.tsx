"use client";

import Link from "next/link";
import { useDictionary } from "@/components/providers/LocaleProvider";

interface CheckoutPageClientProps {
  locale: string;
  tenant: string;
}

export default function CheckoutPageClient({
  locale,
  tenant,
}: CheckoutPageClientProps) {
  const dict = useDictionary();

  return (
    <div className="min-h-screen bg-stone-50 px-4 pb-16 pt-6 text-stone-900">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <h1 className="text-2xl font-semibold">{dict.checkout.title}</h1>
        <p className="text-sm text-stone-600">{dict.checkout.description}</p>
        <Link
          href={`/${locale}/${tenant}/menu`}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          {dict.checkout.backToMenu}
        </Link>
      </div>
    </div>
  );
}
