import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer, FactorList, MarketBadge, ScorePills, StockLink } from "@/components/research";
import { api } from "@/lib/api";

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  let industry;
  try {
    industry = await api.industry.get({ name });
  } catch {
    notFound();
  }
  const [meta, stocks, chains] = await Promise.all([
    api.meta.get(),
    api.universe.list(),
    api.chain.list(),
  ]);
  const related = chains.filter((chain) => chain.layers.some((layer) => layer.industry === industry.name));
  const stockMap = Object.fromEntries(stocks.map((item) => [item.symbol, item]));

  return (
    <>
      <p className="text-sm">
        <Link href="/industries" className="text-muted-foreground hover:underline">
          ← 行业
        </Link>
      </p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{industry.name}</h1>
          <p className="text-muted-foreground">{industry.name_en}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {industry.score.total.toFixed(1)} {industry.score.grade} · {industry.cycle_position}
        </p>
      </div>
      <Disclaimer text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <div className="flex flex-wrap gap-1">
        {industry.markets.map((market) => (
          <MarketBadge key={market} market={market} />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{industry.notes}</p>
      {related.length > 0 ? (
        <p className="text-sm">
          所属产业链：{" "}
          {related.map((chain) => (
            <Link
              key={chain.id}
              href={`/chains/${encodeURIComponent(chain.id)}`}
              className="mr-2 text-sky-300 hover:underline"
            >
              {chain.name}
            </Link>
          ))}
        </p>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>成分股</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {industry.constituents.map((member) => {
              const brief = stockMap[member.symbol];
              return (
                <div key={member.symbol} className="rounded-lg border border-border/80 p-3">
                  <StockLink symbol={member.symbol} name={member.name} />
                  <div className="mt-1 text-xs text-muted-foreground">
                    {member.name_en} · {member.market}
                  </div>
                  {brief ? (
                    <div className="mt-2">
                      <ScorePills
                        composite={brief.composite}
                        quality={brief.quality.total}
                        valuation={brief.valuation.total}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>吸引力因子</CardTitle>
          </CardHeader>
          <CardContent>
            <FactorList score={industry.score} />
          </CardContent>
        </Card>
      </section>
    </>
  );
}
