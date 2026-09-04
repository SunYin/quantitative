"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/messages";
import { displayName, translate } from "@/i18n/engine";

const LocaleContext = createContext<Locale>("zh-CN");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useI18n() {
  const locale = useLocale();
  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) => t(locale, key, vars),
    tx: (text: string) => translate(locale, text),
    name: (zh: string, en?: string) => displayName(locale, zh, en),
  };
}
