import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ScoreBlock } from "@/lib/data";

export function Disclaimer({ text, asOf }: { text: string; asOf: string }) {
  return (
    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
      {text} 快照日期 {asOf}。
    </p>
  );
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
}: {
  composite?: number;
  quality: number;
  valuation: number;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {composite !== undefined ? (
        <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-300">综合 {composite.toFixed(1)}</span>
      ) : null}
      <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">质量 {quality.toFixed(1)}</span>
      <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">估值 {valuation.toFixed(1)}</span>
    </div>
  );
}

export function FactorList({ score }: { score: ScoreBlock }) {
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
            <span>{factor.name}</span>
            <span className="tabular-nums text-muted-foreground">{factor.score.toFixed(0)}</span>
          </div>
          <Progress value={factor.score} />
          <p className="text-xs text-muted-foreground">{factor.rationale}</p>
        </div>
      ))}
      {score.flags.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-amber-200">
          {score.flags.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function StockLink({ symbol, name }: { symbol: string; name: string }) {
  return (
    <Link href={`/stocks/${encodeURIComponent(symbol)}`} className="hover:underline">
      {name}
      <span className="ml-2 font-mono text-xs text-muted-foreground">{symbol}</span>
    </Link>
  );
}

export function pct(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}
