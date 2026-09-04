import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketBadge } from "@/components/research";
import type { Coverage } from "@/lib/data";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/messages";
import { translate } from "@/i18n/engine";

export function CoverageBoard({
  coverage,
  locale,
}: {
  coverage: Coverage;
  locale: Locale;
}) {
  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {coverage.markets.map((row) => (
          <Card key={row.market}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <MarketBadge market={row.market} />
                {t(locale, `coverage.market.${row.market}`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{row.sample}</p>
              <p className="text-xs text-muted-foreground">
                {t(locale, "coverage.sampleLabel")} · {t(locale, "coverage.listedApprox", { n: row.listed_approx })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{translate(locale, coverage.disclaimer)}</p>
    </section>
  );
}

export function CoverageStats({
  coverage,
  locale,
}: {
  coverage: Coverage;
  locale: Locale;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <Stat label={t(locale, "stat.industries")} value={String(coverage.industry_count)} />
      <Stat
        label={t(locale, "stat.ipos")}
        value={String(coverage.ipo_count)}
        href="/ipos"
        linkLabel={t(locale, "coverage.openIpos")}
      />
      <Stat label={t(locale, "stat.sampleTotal")} value={String(coverage.sample_total)} />
    </section>
  );
}

function Stat({
  label,
  value,
  href,
  linkLabel,
}: {
  label: string;
  value: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {href && linkLabel ? (
          <Link href={href} className="text-xs text-muted-foreground hover:underline">
            {linkLabel}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
