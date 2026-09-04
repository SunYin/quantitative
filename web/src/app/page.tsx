import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChangePct,
  Disclaimer,
  MarketBadge,
  Money,
  ScorePills,
  SourceBadge,
  StockLink,
} from "@/components/research";
import { api } from "@/lib/api";

export default async function HomePage() {
  const [meta, stocks, industries, strategies] = await Promise.all([
    api.meta.get(),
    api.universe.list(),
    api.industry.list(),
    api.strategy.list(),
  ]);
  const markets = new Set(stocks.map((s) => s.market));

  return (
    <>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">研究总览</h1>
        <p className="mt-1 text-muted-foreground">同一套质量语言，不同的估值与交易语言。</p>
      </div>
      <Disclaimer text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="样本股票" value={String(stocks.length)} />
        <Stat label="覆盖市场" value={[...markets].join(" / ")} />
        <Stat label="行业" value={String(industries.length)} />
        <Stat label="策略" value={String(strategies.length)} />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>个股综合</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>市场</TableHead>
                <TableHead>现价</TableHead>
                <TableHead>涨跌</TableHead>
                <TableHead>分数</TableHead>
                <TableHead>仓位上限</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => (
                <TableRow key={stock.symbol}>
                  <TableCell>
                    <StockLink symbol={stock.symbol} name={stock.name} />
                    <div className="text-xs text-muted-foreground">{stock.name_en}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <MarketBadge market={stock.market} />
                      <SourceBadge source={stock.quote.source} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Money value={stock.price} currency={stock.currency} />
                  </TableCell>
                  <TableCell>
                    <ChangePct value={stock.change_pct} />
                  </TableCell>
                  <TableCell>
                    <ScorePills
                      composite={stock.composite}
                      quality={stock.quality.total}
                      valuation={stock.valuation.total}
                    />
                  </TableCell>
                  <TableCell className="tabular-nums">{(stock.position_cap * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{value}</CardContent>
    </Card>
  );
}
