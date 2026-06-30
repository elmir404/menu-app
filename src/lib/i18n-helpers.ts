// Axtarış üçün mətni normallaşdırır: kiçik hərf + diakritikləri çıxarır.
// AZ hərfləri fərqli yazılsa da tapılsın: ş→s, ç→c, ö→o, ü→u, ğ→g, İ→i (NFD ilə),
// ə→e, ı→i (dekompozisiya olunmayanlar əl ilə).
export function normalizeSearch(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/ə/g, "e") // ə
    .replace(/ı/g, "i"); // ı
}

export function getLocalizedName(
  item: { azName: string; enName: string; ruName: string },
  locale: string
): string {
  switch (locale) {
    case "en":
      return item.enName || item.azName;
    case "ru":
      return item.ruName || item.azName;
    default:
      return item.azName;
  }
}

export function getLocalizedDescription(
  item: {
    azDescription: string | null;
    enDescription: string | null;
    ruDescription: string | null;
  },
  locale: string
): string {
  switch (locale) {
    case "en":
      return item.enDescription || item.azDescription || "";
    case "ru":
      return item.ruDescription || item.azDescription || "";
    default:
      return item.azDescription || "";
  }
}
