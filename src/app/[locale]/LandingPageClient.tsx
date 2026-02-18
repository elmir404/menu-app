"use client";

import Link from "next/link";
import {
  FiSmartphone,
  FiShoppingCart,
  FiGlobe,
  FiBarChart2,
  FiLink,
  FiMonitor,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";
import { useDictionary } from "@/components/providers/LocaleProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { PublicTenantListItem } from "@/types/api";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import type { Locale } from "@/i18n/config";

const featureIcons = [
  FiSmartphone,
  FiShoppingCart,
  FiGlobe,
  FiBarChart2,
  FiLink,
  FiMonitor,
];

interface LandingPageInnerProps {
  locale: string;
  tenants: PublicTenantListItem[];
}

function LandingPageInner({ locale, tenants }: LandingPageInnerProps) {
  const dict = useDictionary();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 border-b border-stone-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href={`/${locale}`} className="text-xl font-bold text-stone-900">
            QrWithMenu
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[420px] overflow-hidden sm:min-h-[480px] lg:min-h-[540px]">
        {/* Unsplash background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-stone-900/70" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-400 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-stone-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm">
              {dict.home.hero.badge}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {dict.home.hero.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              {dict.home.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <a
                href="#restaurants"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-stone-900 shadow-lg transition hover:bg-stone-100"
              >
                {dict.home.hero.cta}
                <FiArrowRight className="text-sm" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                {dict.home.hero.ctaSecondary}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Tenant / Restaurant Cards Grid */}
      {tenants.length > 0 && (
        <section id="restaurants" className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-stone-900 sm:text-4xl">
                {dict.nav.restaurant}
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tenants.map((tenant) => (
                <Link
                  key={tenant.slug}
                  href={`/${locale}/${tenant.slug}/restaurant`}
                  className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-stone-300 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-stone-900 text-xl font-bold text-white">
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-stone-900 group-hover:text-stone-700">
                    {tenant.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">
                    {tenant.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-stone-600 group-hover:text-stone-900">
                    {dict.home.hero.ctaSecondary}
                    <FiArrowRight className="text-xs transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feature Grid */}
      <section id="features" className="border-t border-stone-200 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-stone-900 sm:text-4xl">
              {dict.home.features.title}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-stone-500">
              {dict.home.features.subtitle}
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dict.home.features.items.map((feature, i) => {
              const Icon = featureIcons[i] || FiSmartphone;
              return (
                <div
                  key={i}
                  className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-stone-300 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-white">
                    <Icon className="text-lg" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-stone-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-stone-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-stone-900 sm:text-4xl">
              {dict.home.howItWorks.title}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-stone-500">
              {dict.home.howItWorks.subtitle}
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {dict.home.howItWorks.steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-xl font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-stone-900 sm:text-4xl">
              {dict.home.pricing.title}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-stone-500">
              {dict.home.pricing.subtitle}
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
              <h3 className="text-lg font-semibold text-stone-900">{dict.home.pricing.free}</h3>
              <p className="mt-2">
                <span className="text-3xl font-bold text-stone-900">$0</span>
                <span className="text-sm text-stone-500">{dict.home.pricing.month}</span>
              </p>
              <ul className="mt-6 space-y-3">
                {dict.home.pricing.features.free.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-stone-600">
                    <FiCheck className="text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-2xl border-2 border-stone-900 bg-white p-6 shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-stone-900 px-3 py-0.5 text-xs font-medium text-white">
                Popular
              </div>
              <h3 className="text-lg font-semibold text-stone-900">{dict.home.pricing.pro}</h3>
              <p className="mt-2">
                <span className="text-3xl font-bold text-stone-900">$29</span>
                <span className="text-sm text-stone-500">{dict.home.pricing.month}</span>
              </p>
              <ul className="mt-6 space-y-3">
                {dict.home.pricing.features.pro.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-stone-600">
                    <FiCheck className="text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
              <h3 className="text-lg font-semibold text-stone-900">{dict.home.pricing.enterprise}</h3>
              <p className="mt-2">
                <span className="text-3xl font-bold text-stone-900">$99</span>
                <span className="text-sm text-stone-500">{dict.home.pricing.month}</span>
              </p>
              <ul className="mt-6 space-y-3">
                {dict.home.pricing.features.enterprise.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-stone-600">
                    <FiCheck className="text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-4">
            <div>
              <h3 className="text-lg font-bold text-stone-900">QrWithMenu</h3>
              <p className="mt-2 text-sm text-stone-500">{dict.footer.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-900">{dict.footer.product}</h4>
              <ul className="mt-3 space-y-2">
                <li><span className="text-sm text-stone-500">{dict.footer.features}</span></li>
                <li><span className="text-sm text-stone-500">{dict.footer.pricing}</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-900">{dict.footer.company}</h4>
              <ul className="mt-3 space-y-2">
                <li><span className="text-sm text-stone-500">{dict.footer.about}</span></li>
                <li><span className="text-sm text-stone-500">{dict.footer.contact}</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-900">{dict.footer.legal}</h4>
              <ul className="mt-3 space-y-2">
                <li><span className="text-sm text-stone-500">{dict.footer.privacy}</span></li>
                <li><span className="text-sm text-stone-500">{dict.footer.terms}</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
            &copy; {new Date().getFullYear()} QrWithMenu. {dict.footer.rights}
          </div>
        </div>
      </footer>
    </div>
  );
}

interface LandingPageClientProps {
  locale: string;
  tenants: PublicTenantListItem[];
}

export default function LandingPageClient({ locale, tenants }: LandingPageClientProps) {
  // LandingPage is outside the tenant layout, so we need a LocaleProvider here
  // The dictionary is loaded server-side and passed via page.tsx
  // But since this is a client component, we use lazy import approach
  // Actually, the locale layout doesn't have LocaleProvider either.
  // We need to wrap this ourselves. Let's use a simpler approach — import dict dynamically.
  return <LandingPageWithDict locale={locale} tenants={tenants} />;
}

// We need to provide dictionary at the landing level since it's outside tenant layout
import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/types";

function LandingPageWithDict({ locale, tenants }: LandingPageClientProps) {
  const [dict, setDict] = useState<Dictionary | null>(null);

  useEffect(() => {
    const loadDict = async () => {
      let d: Dictionary;
      switch (locale) {
        case "en":
          d = (await import("@/i18n/dictionaries/en")).default;
          break;
        case "ru":
          d = (await import("@/i18n/dictionaries/ru")).default;
          break;
        default:
          d = (await import("@/i18n/dictionaries/az")).default;
      }
      setDict(d);
    };
    loadDict();
  }, [locale]);

  if (!dict) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-800" />
      </div>
    );
  }

  return (
    <LocaleProvider locale={locale as Locale} dictionary={dict}>
      <LandingPageInner locale={locale} tenants={tenants} />
    </LocaleProvider>
  );
}
