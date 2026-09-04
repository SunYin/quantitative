"use client";

import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useI18n } from "@/components/locale-provider";

const NAV = [
  { href: "/", key: "nav.overview" },
  { href: "/stocks", key: "nav.stocks" },
  { href: "/industries", key: "nav.industries" },
  { href: "/ipos", key: "nav.ipos" },
  { href: "/strategies", key: "nav.strategies" },
  { href: "/reports", key: "nav.reports" },
  { href: "/markets", key: "nav.markets" },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">
            {t("brand")}
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <LocaleSwitcher />
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">{children}</main>
    </div>
  );
}
