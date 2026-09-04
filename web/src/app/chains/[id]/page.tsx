import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer, FactorList, ScorePills, StockLink } from "@/components/research";
import { api } from "@/lib/api";

export default async function ChainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let chain;
  try {
    chain = await api.chain.get({ id });
  } catch {
    notFound();
  }
  const [meta, stocks] = await Promise.all([api.meta.get(), api.universe.list()]);
  const stockMap = Object.fromEntries(stocks.map((item) => [item.symbol, item]));

  return (
    <>
      <p className="text-sm">
        <Link href="/industries" className="text-muted-foreground hover:underline">
          ← 行业 / 产业链
        </Link>
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">{chain.name}</h1>
      <p className="text-muted-foreground">{chain.name_en}</p>
      <Disclaimer text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <p>{chain.thesis}</p>
      <p className="text-sm text-muted-foreground">{chain.notes}</p>
      <p className="text-sm text-muted-foreground">
        {chain.layers.map((layer) => `${layer.role_zh}·${layer.industry}`).join(" → ")}
      </p>
      <div className="space-y-4">
        {chain.layers.map((layer) => (
          <Card key={`${layer.role}-${layer.industry}`}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {layer.role_zh} ·{" "}
                  <Link
                    href={`/industries/${encodeURIComponent(layer.industry)}`}
                    className="hover:underline"
                  >
                    {layer.industry}
                  </Link>
                  {layer.bottleneck ? (
                    <span className="ml-2 text-xs text-amber-300">瓶颈</span>
                  ) : null}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {layer.score.total.toFixed(1)} {layer.score.grade}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{layer.captures}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {layer.stocks.map((member) => {
                  const brief = stockMap[member.symbol];
                  return (
                    <div key={member.symbol} className="rounded-lg border border-border/80 p-3">
                      <StockLink symbol={member.symbol} name={member.name} />
                      <div className="text-xs text-muted-foreground">
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
              </div>
              <FactorList score={layer.score} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
