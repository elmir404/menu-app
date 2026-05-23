"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiCopy, FiMapPin, FiPhone, FiMail, FiExternalLink, FiChevronRight, FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiLinkedin, FiGlobe, FiList } from "react-icons/fi";
import { FaGoogle, FaWhatsapp, FaTelegram, FaTiktok, FaPinterestP, FaYelp, FaThreads } from "react-icons/fa6";
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
  branchSlug?: string;
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
  branchSlug,
}: RestaurantPageClientProps) {
  const dict = useDictionary();
  const tenantConfig = useTenant();
  const router = useRouter();
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
        const url = branchSlug
          ? `${API_BASE}/api/public/restaurants/${tenantSlug}/${branchSlug}`
          : `${API_BASE}/api/public/restaurants/${tenantSlug}`;
        const res = await fetch(url);
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
  }, [tenantSlug, branchSlug, API_BASE]);

  if (status === "loading") {
    return <LoadingState message={dict.restaurant.loading} />;
  }

  if (status === "error") {
    return <ErrorState message={dict.restaurant.error} />;
  }

  const branding = tenantConfig.branding;
  // Branch context-da branch overrideler tenant fallback ilə birgə
  const branchOverride = restaurant?.branch ?? null;
  const isBranchContext = !!branchOverride;

  // Wifi: branch context-də backend union qaytarır; əks halda tenant config-dən
  const wifiList = isBranchContext
    ? restaurant?.wifiInformation ?? []
    : tenantConfig.wifiInformation || [];

  // Filiallar siyahısı yalnız tenant root-da görünür
  const branches = isBranchContext
    ? []
    : (tenantConfig.branches ?? []).filter((b) => !!b.slug);

  // Header: branch photo > branch logo > tenant background > tenant logo
  const headerImage = (branchOverride?.photoUrl && getMediaUrl(branchOverride.photoUrl))
    || (branchOverride?.logoUrl && getMediaUrl(branchOverride.logoUrl))
    || (branding?.backgroundImageUrl && getMediaUrl(branding.backgroundImageUrl))
    || (branding?.logoUrl && getMediaUrl(branding.logoUrl))
    || "";

  const displayName = branchOverride?.name ?? tenantConfig.name;

  // Sosial URL helper: branch override > tenant restaurant data
  const pickUrl = (branchKey: keyof NonNullable<typeof branchOverride>, tenantUrl: string | null | undefined) =>
    (branchOverride && (branchOverride[branchKey] as string | null)) || tenantUrl || null;

  const phone = branchOverride?.phone ?? restaurant?.contactPhone ?? null;
  const email = branchOverride?.email ?? restaurant?.contactEmail ?? null;
  const locationUrl = pickUrl("locationUrl", restaurant?.locationUrl);
  const wazeLocationUrl = pickUrl("wazeLocationUrl", restaurant?.wazeLocationUrl);

  const links = [...(restaurant?.links ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <div className="min-h-screen bg-stone-50 px-4 pb-8 pt-4 sm:px-5 sm:pt-5">
      <RestaurantHeader
        image={headerImage || ""}
        name={displayName}
        rating={0}
      />

      {isBranchContext && (
        <button
          type="button"
          onClick={() => router.push(`/${locale}/${tenantSlug}/b/${branchSlug}/menu`)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-stone-800"
        >
          <FiList /> {dict.nav?.menu ?? "Menyu"}
        </button>
      )}

      {branches.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-stone-800">
            {dict.restaurant.branches ?? "Filiallar"}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {branches.map((branch) => {
              const socials: Array<{ url: string; icon: React.ReactNode; label: string }> = [];
              if (branch.locationUrl) socials.push({ url: branch.locationUrl, icon: <FaGoogle />, label: "Google Maps" });
              if (branch.wazeLocationUrl) socials.push({ url: branch.wazeLocationUrl, icon: <SiWaze />, label: "Waze" });
              if (branch.instagramUrl) socials.push({ url: branch.instagramUrl, icon: <FiInstagram />, label: "Instagram" });
              if (branch.facebookUrl) socials.push({ url: branch.facebookUrl, icon: <FiFacebook />, label: "Facebook" });
              if (branch.whatsAppUrl) socials.push({ url: branch.whatsAppUrl, icon: <FaWhatsapp />, label: "WhatsApp" });
              if (branch.telegramUrl) socials.push({ url: branch.telegramUrl, icon: <FaTelegram />, label: "Telegram" });
              if (branch.tiktokUrl) socials.push({ url: branch.tiktokUrl, icon: <FaTiktok />, label: "TikTok" });
              if (branch.youtubeUrl) socials.push({ url: branch.youtubeUrl, icon: <FiYoutube />, label: "YouTube" });
              if (branch.twitterUrl) socials.push({ url: branch.twitterUrl, icon: <FiTwitter />, label: "Twitter/X" });
              if (branch.linkedInUrl) socials.push({ url: branch.linkedInUrl, icon: <FiLinkedin />, label: "LinkedIn" });
              if (branch.tripAdvisorUrl) socials.push({ url: branch.tripAdvisorUrl, icon: <FiGlobe />, label: "TripAdvisor" });
              if (branch.yelpUrl) socials.push({ url: branch.yelpUrl, icon: <FaYelp />, label: "Yelp" });
              if (branch.threadsUrl) socials.push({ url: branch.threadsUrl, icon: <FaThreads />, label: "Threads" });
              if (branch.pinterestUrl) socials.push({ url: branch.pinterestUrl, icon: <FaPinterestP />, label: "Pinterest" });
              if (branch.websiteUrl) socials.push({ url: branch.websiteUrl, icon: <FiGlobe />, label: "Website" });

              return (
                <div
                  key={branch.id}
                  className="rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <Link
                    href={`/${locale}/${tenantSlug}/b/${branch.slug}/menu`}
                    className="group flex items-center gap-4"
                  >
                    <span
                      className="flex shrink-0 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: branding?.primaryColor || "#0a0a0a", width: 44, height: 44 }}
                      aria-hidden="true"
                    >
                      <FiMapPin className="text-xl" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-stone-900">
                        {branch.name}
                        {branch.isMainBranch && (
                          <span className="ml-2 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                            {dict.restaurant.mainBranch ?? "Əsas"}
                          </span>
                        )}
                      </span>
                      {branch.address && (
                        <span className="block truncate text-xs text-stone-500">{branch.address}</span>
                      )}
                    </span>
                    <FiChevronRight className="shrink-0 text-stone-400 transition-colors group-hover:text-stone-600" />
                  </Link>

                  {(branch.phone || branch.email) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {branch.phone && (
                        <a
                          href={`tel:${branch.phone}`}
                          className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50"
                        >
                          <FiPhone className="text-xs" /> {branch.phone}
                        </a>
                      )}
                      {branch.email && (
                        <a
                          href={`mailto:${branch.email}`}
                          className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50"
                        >
                          <FiMail className="text-xs" /> {branch.email}
                        </a>
                      )}
                    </div>
                  )}

                  {socials.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {socials.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={s.label}
                          title={s.label}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                        >
                          {s.icon}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

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
      {(phone || email) && (
        <section className="mt-4 rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl">
          <h2 className="text-sm font-semibold text-stone-800">
            {dict.restaurant.contact}
          </h2>
          {phone && (
            <a
              href={`tel:${phone}`}
              className="mt-3 flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-900"
            >
              <FiPhone className="text-sm text-stone-600" aria-hidden="true" />
              <span>{formatPhone(phone)}</span>
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="mt-2 flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-900"
            >
              <FiMail className="text-sm text-stone-600" aria-hidden="true" />
              <span>{email}</span>
            </a>
          )}
        </section>
      )}

      {/* Location */}
      {(locationUrl || wazeLocationUrl) && (
        <section className="mt-4 rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl">
          <h2 className="text-sm font-semibold text-stone-800">
            {dict.restaurant.location}
          </h2>
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-stone-900">
              <FiMapPin className="text-sm text-stone-600" aria-hidden="true" />
              <span>
                {branchOverride?.address
                  ? branchOverride.address
                  : restaurant?.location
                    ? `${restaurant.location.cityName}, ${restaurant.location.countryName}`
                    : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {locationUrl && (
                <a
                  href={locationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-12 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600"
                  aria-label="Google Maps"
                >
                  <FaGoogle className="text-md" />
                </a>
              )}
              {wazeLocationUrl && (
                <a
                  href={wazeLocationUrl}
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
