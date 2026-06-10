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
