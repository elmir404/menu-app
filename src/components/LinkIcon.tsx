import type { ComponentType, SVGProps } from "react";
import { MdOutlineMenuBook, MdOutlineLocalOffer } from "react-icons/md";
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiLink,
  FiGlobe,
  FiYoutube,
  FiTwitter,
} from "react-icons/fi";
import {
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaTelegram,
  FaLinkedin,
  FaTiktok,
  FaGoogle,
} from "react-icons/fa";
import { SiWaze } from "react-icons/si";

export type IconKey =
  | "menu"
  | "offer"
  | "feedback"
  | "instagram"
  | "facebook"
  | "whatsapp"
  | "telegram"
  | "linkedin"
  | "twitter"
  | "tiktok"
  | "youtube"
  | "phone"
  | "email"
  | "location"
  | "waze"
  | "website"
  | "link";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const ICON_MAP: Record<IconKey, IconComponent> = {
  menu: MdOutlineMenuBook,
  offer: MdOutlineLocalOffer,
  feedback: FiMessageSquare,
  instagram: FaInstagram,
  facebook: FaFacebook,
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
  linkedin: FaLinkedin,
  twitter: FiTwitter,
  tiktok: FaTiktok,
  youtube: FiYoutube,
  phone: FiPhone,
  email: FiMail,
  location: FaGoogle,
  waze: SiWaze,
  website: FiGlobe,
  link: FiLink,
};

export const ICON_OPTIONS: { key: IconKey; label: string }[] = [
  { key: "menu", label: "Menyu" },
  { key: "offer", label: "Təklif" },
  { key: "feedback", label: "Şikayət / Rəy" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "telegram", label: "Telegram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "Twitter / X" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
  { key: "phone", label: "Telefon" },
  { key: "email", label: "Email" },
  { key: "location", label: "Google Maps" },
  { key: "waze", label: "Waze" },
  { key: "website", label: "Veb sayt" },
  { key: "link", label: "Digər" },
];

export function getLinkIcon(key: string | null | undefined): IconComponent {
  if (key && key in ICON_MAP) {
    return ICON_MAP[key as IconKey];
  }
  return FiLink;
}

export function LinkIcon({
  iconKey,
  className,
}: {
  iconKey: string | null | undefined;
  className?: string;
}) {
  const Icon = getLinkIcon(iconKey);
  return <Icon className={className} aria-hidden="true" />;
}
