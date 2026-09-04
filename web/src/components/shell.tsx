import Link from "next/link";

const NAV = [
  { href: "/", label: "总览" },
  { href: "/stocks", label: "个股" },
  { href: "/industries", label: "行业" },
  { href: "/strategies", label: "策略" },
  { href: "/reports", label: "研报" },
  { href: "/markets", label: "市场" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">
            跨市场研究看板
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">{children}</main>
    </div>
  );
}
