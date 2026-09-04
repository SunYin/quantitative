"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LOCALES, type Locale } from "@/i18n/config";
import { t } from "@/i18n/messages";
import { useLocale } from "@/components/locale-provider";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  async function choose(next: Locale) {
    if (next === locale) return;
    await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1" aria-label={t(locale, "lang.label")}>
      {LOCALES.map((item) => (
        <Button
          key={item}
          type="button"
          size="xs"
          variant={item === locale ? "secondary" : "ghost"}
          onClick={() => choose(item)}
        >
          {t(locale, `lang.${item}`)}
        </Button>
      ))}
    </div>
  );
}
