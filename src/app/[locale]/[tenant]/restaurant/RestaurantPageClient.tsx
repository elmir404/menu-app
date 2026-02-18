"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MdOutlineMenuBook } from "react-icons/md";
import { FiCopy, FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import { FaGoogle, FaInstagram, FaFacebook, FaWhatsapp, FaTelegram, FaLinkedin } from "react-icons/fa";
import { SiWaze } from "react-icons/si";
import RatingModal from "@/components/RatingModal";
import RestaurantHeader from "@/components/RestaurantHeader";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { useDictionary } from "@/components/providers/LocaleProvider";
import { useTenant } from "@/components/providers/TenantProvider";
import type { RestaurantPublic } from "@/types/api";
import { getMediaUrl } from "@/lib/api/client";

interface RestaurantPageClientProps {
  locale: string;
  tenantSlug: string;
}

export default function RestaurantPageClient({
  locale,
  tenantSlug,
}: RestaurantPageClientProps) {
  const dict = useDictionary();
  const tenantConfig = useTenant();
  const [restaurant, setRestaurant] = useState<RestaurantPublic | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isRatingOpen, setIsRatingOpen] = useState(false);
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

  const socialLinks = [
    { url: restaurant?.instagramUrl, icon: FaInstagram, label: "Instagram" },
    { url: restaurant?.facebookUrl, icon: FaFacebook, label: "Facebook" },
    { url: restaurant?.whatsAppUrl, icon: FaWhatsapp, label: "WhatsApp" },
    { url: restaurant?.telegramUrl, icon: FaTelegram, label: "Telegram" },
    { url: restaurant?.linkedInUrl, icon: FaLinkedin, label: "LinkedIn" },
  ].filter((s) => s.url);

  return (
    <div className="p-4">
      <RestaurantHeader
        image={headerImage || ""}
        name={tenantConfig.name}
        rating={0}
      />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          className="flex items-center justify-center rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-800"
          onClick={() => setIsRatingOpen(true)}
        >
          {dict.restaurant.rateUs}
        </button>
        <Link
          href={`/${locale}/${tenantSlug}/menu`}
          className="cta-ripple flex flex-1 items-center justify-between rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white"
        >
          <span className="flex items-center gap-2">
            <MdOutlineMenuBook className="text-base" aria-hidden="true" />
            <span>{dict.nav.menu}</span>
          </span>
          <span className="text-xs font-normal text-white/70">
            {dict.restaurant.tryOurFlavors}
          </span>
        </Link>
      </div>

      {/* WiFi Information */}
      {wifiList.length > 0 && (
        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
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
                    {wifi.ssid || "\u2014"}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-stone-500">
                    {dict.restaurant.password}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-stone-900">
                      {wifi.password || "\u2014"}
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
      <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
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

      {/* Location */}
      {(restaurant?.locationUrl || restaurant?.wazeLocationUrl) && (
        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-800">
            {dict.restaurant.location}
          </h2>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-medium text-stone-900">
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

      {/* Social Media */}
      {socialLinks.length > 0 && (
        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-800">
            Social Media
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.url!}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-600 transition hover:bg-stone-100"
                  aria-label={social.label}
                >
                  <Icon className="text-lg" />
                </a>
              );
            })}
          </div>
        </section>
      )}

      <RatingModal
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
      />
    </div>
  );
}
