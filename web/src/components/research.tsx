import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { LiveSource, QuoteMeta, ScoreBlock } from "@/lib/data";
import type { Locale } from "@/i18n/config";
import { numberLocale } from "@/i18n/config";
import { t } from "@/i18n/messages";
import { translate } from "@/i18n/engine";

export function Disclaimer({
  text,
  asOf,
  live,
  locale,
}: {
  text: string;
  asOf: string;
  live?: { quotes: string; scores: string; fetched_at: string | null };
  locale: Locale;
}) {
  return (
    <div className="space-y-2">
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
        {translate(locale, text)} {t(locale, "disclaimer.asOf", { asOf })}
      </p>
      {live ? (
        <p className="text-xs text-muted-foreground">
          {t(locale, "disclaimer.quoteSource")} {liveLabel(locale, live.quotes)} · {t(locale, "disclaimer.researchScores")}{" "}
          {live.scores === "live-rescored"
            ? t(locale, "disclaimer.liveRescored")
            : t(locale, "disclaimer.sampleFinancials")}
          {live.fetched_at ? ` · ${t(locale, "disclaimer.quoteTime")} ${live.fetched_at}` : ""}
        </p>
      ) : null}
    </div>
  );
}

export function SourceBadge({ source, locale }: { source: QuoteMeta["source"]; locale: Locale }) {
  const label =
    source === "yahoo" ? t(locale, "source.yahoo") : source === "mixed" ? t(locale, "source.mixed") : t(locale, "source.sample");
  const styles =
    source === "yahoo"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : source === "mixed"
        ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
        : "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={styles}>
      {label}
    </Badge>
  );
}

export function FieldSource({ source, locale }: { source: LiveSource; locale: Locale }) {
  return (
    <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">
      {source === "yahoo" ? t(locale, "field.yahoo") : t(locale, "field.sample")}
    </span>
  );
}

export function ChangePct({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  const up = value > 0;
  const down = value < 0;
  const cls = up ? "text-emerald-400" : down ? "text-rose-400" : "text-muted-foreground";
  const sign = up ? "+" : "";
  return (
    <span className={`tabular-nums ${cls}`}>
      {sign}
      {(value * 100).toFixed(2)}%
    </span>
  );
}

export function Money({ value, currency, locale }: { value: number; currency: string; locale: Locale }) {
  return (
    <span className="tabular-nums">
      {value.toLocaleString(numberLocale(locale), { maximumFractionDigits: 2 })}{" "}
      <span className="text-xs text-muted-foreground">{currency}</span>
    </span>
  );
}

function liveLabel(locale: Locale, value: string) {
  if (value === "yahoo") return t(locale, "live.yahoo");
  if (value === "mixed") return t(locale, "live.mixed");
  return t(locale, "live.sample");
}

export function MarketBadge({ market }: { market: string }) {
  const styles: Record<string, string> = {
    A: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    HK: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    US: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    AH: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  };
  return (
    <Badge variant="outline" className={styles[market] ?? ""}>
      {market}
    </Badge>
  );
}

export function ScorePills({
  composite,
  quality,
  valuation,
  locale,
}: {
  composite?: number;
  quality: number;
  valuation: number;
  locale: Locale;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {composite !== undefined ? (
        <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-300">
          {t(locale, "score.composite")} {composite.toFixed(1)}
        </span>
      ) : null}
      <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
        {t(locale, "score.quality")} {quality.toFixed(1)}
      </span>
      <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
        {t(locale, "score.valuation")} {valuation.toFixed(1)}
      </span>
    </div>
  );
}

export function FactorList({ score, locale }: { score: ScoreBlock; locale: Locale }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-semibold tabular-nums">
          {score.total.toFixed(1)} <span className="text-base text-muted-foreground">{score.grade}</span>
        </p>
      </div>
      {score.factors.map((factor) => (
        <div key={factor.name} className="space-y-1">
          <div className="flex justify-between gap-3 text-sm">
            <span>{translate(locale, factor.name)}</span>
            <span className="tabular-nums text-muted-foreground">{factor.score.toFixed(0)}</span>
          </div>
          <Progress value={factor.score} />
          <p className="text-xs text-muted-foreground">{translate(locale, factor.rationale)}</p>
        </div>
      ))}
      {score.flags.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-amber-200">
          {score.flags.map((flag) => (
            <li key={flag}>{translate(locale, flag)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function StockLink({
  symbol,
  name,
  nameEn,
  locale,
}: {
  symbol: string;
  name: string;
  nameEn?: string;
  locale: Locale;
}) {
  const label = locale === "en" ? nameEn || translate("en", name) : translate(locale, name);
  return (
    <Link href={`/stocks/${encodeURIComponent(symbol)}`} className="hover:underline">
      {label}
      <span className="ml-2 font-mono text-xs text-muted-foreground">{symbol}</span>
    </Link>
  );
}

export function IpoStatusBadge({ status, locale }: { status: string; locale: Locale }) {
  const key = `ipo.status.${status}`;
  const label = t(locale, key);
  const styles: Record<string, string> = {
    hearing: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    filed: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    passed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    subscribed: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    priced: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    listed: "bg-muted text-muted-foreground",
    postponed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  return (
    <Badge variant="outline" className={styles[status] ?? "bg-muted text-muted-foreground"}>
      {label === key ? status : label}
    </Badge>
  );
}

export function multiple(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function pct(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}
