import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChangePct,
  Disclaimer,
  FactorList,
  FieldSource,
  MarketBadge,
  Money,
  SourceBadge,
  multiple,
  pct,
} from "@/components/research";
import { api } from "@/lib/api";

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
  const fields = stock.quote.fields;

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
        <div className="flex flex-wrap gap-1">
          <MarketBadge market={stock.market} />
          <SourceBadge source={stock.quote.source} />
        </div>
      </div>
      <Disclaimer text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <p className="text-sm text-muted-foreground">{stock.connect.implication}</p>
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>报价 / 仓位</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-3xl font-semibold">
              <Money value={stock.price} currency={stock.currency} />
              <FieldSource source={fields.price} />
            </p>
            <p>
              涨跌 <ChangePct value={stock.change_pct} />
              <FieldSource source={fields.change_pct} />
            </p>
            <p className="text-2xl font-semibold tabular-nums">{stock.composite.toFixed(1)} 综合</p>
            <p>研究仓位上限 {(stock.position_cap * 100).toFixed(1)}%</p>
            <p>行业 {stock.industry} · {stock.board}</p>
            <p>
              PE {multiple(stock.pe_ttm)}
              <FieldSource source={fields.pe_ttm} />
              {" · "}PB {multiple(stock.pb)}
              <FieldSource source={fields.pb} />
            </p>
            <p>
              股息 {pct(stock.dividend_yield)}
              <FieldSource source={fields.dividend_yield} />
              {" · "}ROE {pct(stock.roe)}
              <FieldSource source={fields.roe} />
            </p>
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
