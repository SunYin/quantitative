export const LOCALES = ["zh-CN", "zh-Hant", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh-CN";
export const LOCALE_COOKIE = "locale";

const ALIASES: Record<string, Locale> = {
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  "zh-sg": "zh-CN",
  cn: "zh-CN",
  "zh-hant": "zh-Hant",
  "zh-hk": "zh-Hant",
  "zh-tw": "zh-Hant",
  "zh-mo": "zh-Hant",
  hant: "zh-Hant",
  hk: "zh-Hant",
  tw: "zh-Hant",
  en: "en",
  "en-us": "en",
  "en-gb": "en",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const lower = value.trim().replaceAll("_", "-").toLowerCase();
  if (ALIASES[lower]) return ALIASES[lower];
  if (lower.startsWith("zh-hant") || lower.startsWith("zh-hk") || lower.startsWith("zh-tw")) return "zh-Hant";
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("zh")) return "zh-CN";
  return DEFAULT_LOCALE;
}

export function htmlLang(locale: Locale): string {
  return { "zh-CN": "zh-CN", "zh-Hant": "zh-HK", en: "en" }[locale];
}

export function numberLocale(locale: Locale): string {
  return { "zh-CN": "zh-CN", "zh-Hant": "zh-HK", en: "en-US" }[locale];
}

export function negotiate(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const parts = acceptLanguage.split(",").map((part) => {
    const [tag, ...params] = part.trim().split(";");
    const q = params.find((item) => item.trim().startsWith("q="));
    return { tag: tag.trim(), q: q ? Number(q.split("=")[1]) || 0 : 1 };
  });
  parts.sort((a, b) => b.q - a.q);
  for (const part of parts) {
    const resolved = normalizeLocale(part.tag);
    if (part.tag.toLowerCase().startsWith("en")) return "en";
    if (
      part.tag.toLowerCase().startsWith("zh-hant") ||
      part.tag.toLowerCase().startsWith("zh-hk") ||
      part.tag.toLowerCase().startsWith("zh-tw")
    ) {
      return "zh-Hant";
    }
    if (part.tag.toLowerCase() === "zh" || part.tag.toLowerCase().startsWith("zh-cn")) return "zh-CN";
    if (resolved !== DEFAULT_LOCALE) return resolved;
  }
  return DEFAULT_LOCALE;
}
