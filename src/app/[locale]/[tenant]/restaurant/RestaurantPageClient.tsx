"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiCopy, FiMapPin, FiPhone, FiMail, FiExternalLink } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";
import { SiWaze } from "react-icons/si";
import RestaurantHeader from "@/components/RestaurantHeader";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { LinkIcon, getIconBrandColor } from "@/components/LinkIcon";
import { useDictionary } from "@/components/providers/LocaleProvider";
import { useTenant } from "@/components/providers/TenantProvider";
import type { PublicRestaurantLink, RestaurantPublic } from "@/types/api";
import { getMediaUrl } from "@/lib/api/client";

interface RestaurantPageClientProps {
  locale: string;
  tenantSlug: string;
}

function pickTitle(link: PublicRestaurantLink, locale: string): string {
  if (locale === "en" && link.enTitle) return link.enTitle;
  if (locale === "ru" && link.ruTitle) return link.ruTitle;
  return link.azTitle;
}

function isInternalLink(url: string): boolean {
  return url.startsWith("/");
}

export default function RestaurantPageClient({
  locale,
  tenantSlug,
}: RestaurantPageClientProps) {
  const dict = useDictionary();
  const tenantConfig = useTenant();
  const [restaurant, setRestaurant] = useState<RestaurantPublic | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  const formatPhone = (phone: string | null) => {
    if (!phone) return "-";
    const match = phone.match(/^(\+\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/);
    if (!match) return phone;
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
  };

  const handleCopyPassword = async (password: string, wifiId: number) => {
    if (!navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopiedId(wifiId);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/public/restaurants/${tenantSlug}`
        );
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        if (json.success && json.data) {
          setRestaurant(json.data);
        }
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    };

    loadRestaurant();
  }, [tenantSlug, API_BASE]);

  if (status === "loading") {
    return <LoadingState message={dict.restaurant.loading} />;
  }

  if (status === "error") {
    return <ErrorState message={dict.restaurant.error} />;
  }

  const branding = tenantConfig.branding;
  const wifiList = tenantConfig.wifiInformation || [];
  const headerImage = branding?.backgroundImageUrl
    ? getMediaUrl(branding.backgroundImageUrl)
    : branding?.logoUrl
      ? getMediaUrl(branding.logoUrl)
      : "";

  const links = [...(restaurant?.links ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <div className="min-h-screen bg-stone-50 px-4 pb-8 pt-4 sm:px-5 sm:pt-5">
      <RestaurantHeader
        image={headerImage || ""}
        name={tenantConfig.name}
        rating={0}
      />

      {links.length > 0 && (
        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {links.map((link) => {
            const title = pickTitle(link, locale);
            const internal = isInternalLink(link.url);
            const brandColor = getIconBrandColor(link.iconKey);

            const cardClass =
              "group flex items-center gap-4 rounded-2xl bg-white px-4 py-4 " +
              "shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5";

            const inner = (
              <>
                <span
                  className="flex shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: brandColor, width: 44, height: 44 }}
                  aria-hidden="true"
                >
                  <LinkIcon iconKey={link.iconKey} className="text-xl" />
                </span>
                <span className="min-w-0 flex-1 truncate text-base font-semibold text-stone-900">
                  {title}
                </span>
                <FiExternalLink
                  className="shrink-0 text-stone-400 transition-colors group-hover:text-stone-600"
                  aria-hidden="true"
                />
              </>
            );

            if (internal) {
              return (
                <Link key={link.id} href={link.url} className={cardClass}>
                  {inner}
                </Link>
              );
            }

            return (
              <a
                key={link.id}
                href={link.url}
                target={link.openInNewTab ? "_blank" : undefined}
                rel={link.openInNewTab ? "noreferrer" : undefined}
                className={cardClass}
              >
                {inner}
              </a>
            );
          })}
        </section>
      )}

      {/* WiFi Information */}
      {wifiList.length > 0 && (
        <section className="mt-4 rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl">
          <h2 className="text-sm font-semibold text-stone-800">
            {dict.restaurant.wifi}
          </h2>
          <div className="mt-3 space-y-3">
            {wifiList.map((wifi) => (
              <div key={wifi.id} className="grid gap-2">
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-stone-500">
                    {dict.restaurant.network}
                  </p>
                  <p className="text-sm font-medium text-stone-900">
                    {wifi.ssid || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-stone-500">
                    {dict.restaurant.password}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-stone-900">
                      {wifi.password || "—"}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(wifi.password, wifi.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-600"
                    >
                      <FiCopy className="text-xs" aria-hidden="true" />
                      {copiedId === wifi.id
                        ? dict.restaurant.copied
                        : dict.restaurant.copy}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact Information */}
      {(restaurant?.contactPhone || restaurant?.contactEmail) && (
        <section className="mt-4 rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl">
          <h2 className="text-sm font-semibold text-stone-800">
            {dict.restaurant.contact}
          </h2>
          {restaurant?.contactPhone && (
            <a
              href={`tel:${restaurant.contactPhone}`}
              className="mt-3 flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-900"
            >
              <FiPhone className="text-sm text-stone-600" aria-hidden="true" />
              <span>{formatPhone(restaurant.contactPhone)}</span>
            </a>
          )}
          {restaurant?.contactEmail && (
            <a
              href={`mailto:${restaurant.contactEmail}`}
              className="mt-2 flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-900"
            >
              <FiMail className="text-sm text-stone-600" aria-hidden="true" />
              <span>{restaurant.contactEmail}</span>
            </a>
          )}
        </section>
      )}

      {/* Location */}
      {(restaurant?.locationUrl || restaurant?.wazeLocationUrl) && (
        <section className="mt-4 rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl">
          <h2 className="text-sm font-semibold text-stone-800">
            {dict.restaurant.location}
          </h2>
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-stone-900">
              <FiMapPin className="text-sm text-stone-600" aria-hidden="true" />
              <span>
                {restaurant?.location
                  ? `${restaurant.location.cityName}, ${restaurant.location.countryName}`
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {restaurant?.locationUrl && (
                <a
                  href={restaurant.locationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-12 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600"
                  aria-label="Google Maps"
                >
                  <FaGoogle className="text-md" />
                </a>
              )}
              {restaurant?.wazeLocationUrl && (
                <a
                  href={restaurant.wazeLocationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-12 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600"
                  aria-label="Waze"
                >
                  <SiWaze className="text-md" />
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
