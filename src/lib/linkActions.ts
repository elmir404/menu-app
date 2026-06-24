// Çoxseçimli link aksiyaları — helper-lər (admin + public paylaşır)

export type LinkActionKind =
  | "whatsapp"
  | "call"
  | "sms"
  | "telegram"
  | "email"
  | "link";

export interface LinkAction {
  kind: LinkActionKind;
  value: string;
  label?: string | null;
}

type Locale = "az" | "en" | "ru" | string;

// Növə görə default etiket (3 dildə) + admin panel üçün seçim adı
export const ACTION_KINDS: {
  kind: LinkActionKind;
  adminLabel: string; // admin select-də görünən
  labels: { az: string; en: string; ru: string };
}[] = [
  {
    kind: "whatsapp",
    adminLabel: "WhatsApp (mesaj)",
    labels: { az: "WhatsApp-da yaz", en: "Message on WhatsApp", ru: "Написать в WhatsApp" },
  },
  {
    kind: "call",
    adminLabel: "Zəng (telefon)",
    labels: { az: "Zəng et", en: "Call", ru: "Позвонить" },
  },
  {
    kind: "sms",
    adminLabel: "SMS",
    labels: { az: "SMS yaz", en: "Send SMS", ru: "Отправить SMS" },
  },
  {
    kind: "telegram",
    adminLabel: "Telegram",
    labels: { az: "Telegram", en: "Telegram", ru: "Telegram" },
  },
  {
    kind: "email",
    adminLabel: "Email",
    labels: { az: "E-poçt yaz", en: "Send email", ru: "Написать на почту" },
  },
  {
    kind: "link",
    adminLabel: "Digər URL",
    labels: { az: "Keçid", en: "Open link", ru: "Открыть ссылку" },
  },
];

export function defaultActionLabel(kind: LinkActionKind, locale: Locale): string {
  const entry = ACTION_KINDS.find((k) => k.kind === kind);
  if (!entry) return "";
  const l = (locale === "en" || locale === "ru" ? locale : "az") as
    | "az"
    | "en"
    | "ru";
  return entry.labels[l];
}

export function actionLabel(action: LinkAction, locale: Locale): string {
  const custom = action.label?.trim();
  return custom && custom.length > 0
    ? custom
    : defaultActionLabel(action.kind, locale);
}

// Public LinkIcon iconKey-i ilə uyğun
export function actionIconKey(kind: LinkActionKind): string {
  switch (kind) {
    case "whatsapp":
      return "whatsapp";
    case "call":
    case "sms":
      return "phone";
    case "telegram":
      return "telegram";
    case "email":
      return "email";
    default:
      return "link";
  }
}

// Aksiyanı açıla bilən href-ə çevirir
export function buildActionHref(action: LinkAction): string {
  const v = (action.value ?? "").trim();
  switch (action.kind) {
    case "whatsapp": {
      // Tam URL yapışdırılıbsa olduğu kimi saxla (əks halda query param rəqəmləri
      // nömrəyə yapışır, məs. app_absent=0 → sonda artıq sıfır).
      if (/^https?:\/\//i.test(v) || /wa\.me|whatsapp\.com/i.test(v)) {
        const m = v.match(/[?&]phone=(\d+)/i);
        return m ? `https://wa.me/${m[1]}` : v;
      }
      const digits = v.replace(/[^\d]/g, "");
      return `https://wa.me/${digits}`;
    }
    case "call":
      return `tel:${v.replace(/\s+/g, "")}`;
    case "sms":
      return `sms:${v.replace(/\s+/g, "")}`;
    case "telegram":
      if (/^https?:\/\//i.test(v)) return v;
      return `https://t.me/${v.replace(/^@/, "")}`;
    case "email":
      if (/^mailto:/i.test(v)) return v;
      return `mailto:${v}`;
    case "link":
    default:
      return v;
  }
}
