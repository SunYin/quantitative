import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, negotiate, type Locale } from "./config";
import { t } from "./messages";
import { displayName, translate } from "./engine";

export async function getLocale(): Promise<Locale> {
  const cookie = (await cookies()).get("locale")?.value;
  if (isLocale(cookie)) return cookie;
  return negotiate((await headers()).get("accept-language"));
}

export async function getI18n() {
  const locale = await getLocale();
  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) => t(locale, key, vars),
    tx: (text: string) => translate(locale, text),
    name: (zh: string, en?: string) => displayName(locale, zh, en),
  };
}

export function fallbackLocale(): Locale {
  return DEFAULT_LOCALE;
}
