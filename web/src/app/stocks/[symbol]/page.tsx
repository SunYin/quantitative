import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer, FactorList, MarketBadge, pct } from "@/components/research";
import { api } from "@/lib/api";
import { listStocks } from "@/lib/data";

export function generateStaticParams() {
  return listStocks().map((stock) => ({ symbol: stock.symbol }));
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  let stock;
  try {
    stock = await api.stock.get({ symbol });
  } catch {
    notFound();
  }
  const meta = await api.meta.get();

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {stock.name}{" "}
            <span className="font-mono text-lg text-muted-foreground">{stock.symbol}</span>
          </h1>
          <p className="text-muted-foreground">{stock.name_en}</p>
        </div>
        <MarketBadge market={stock.market} />
      </div>
      <Disclaimer text={meta.disclaimer} asOf={meta.as_of} />
      <p className="text-sm text-muted-foreground">{stock.connect.implication}</p>
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>综合 / 仓位</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-3xl font-semibold tabular-nums">{stock.composite.toFixed(1)}</p>
            <p>研究仓位上限 {(stock.position_cap * 100).toFixed(1)}%</p>
            <p>行业 {stock.industry} · {stock.board}</p>
            <p>PE {stock.pe_ttm ?? "—"} · PB {stock.pb ?? "—"} · 股息 {pct(stock.dividend_yield)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>质量 {stock.quality.grade}</CardTitle>
          </CardHeader>
          <CardContent>
            <FactorList score={stock.quality} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>估值 {stock.valuation.grade}</CardTitle>
          </CardHeader>
          <CardContent>
            <FactorList score={stock.valuation} />
          </CardContent>
        </Card>
      </section>
      {stock.notes ? <p className="text-sm text-muted-foreground">{stock.notes}</p> : null}
    </>
  );
}
