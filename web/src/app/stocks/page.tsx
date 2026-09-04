import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Disclaimer, MarketBadge, ScorePills, StockLink } from "@/components/research";
import { api } from "@/lib/api";

export default async function StocksPage() {
  const [meta, stocks] = await Promise.all([api.meta.get(), api.universe.list()]);
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">个股</h1>
      <Disclaimer text={meta.disclaimer} asOf={meta.as_of} />
      <Card>
        <CardHeader>
          <CardTitle>样本宇宙</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>代码</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>市场</TableHead>
                <TableHead>分数</TableHead>
                <TableHead>互联互通</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => (
                <TableRow key={stock.symbol}>
                  <TableCell className="font-mono text-xs">{stock.symbol}</TableCell>
                  <TableCell>
                    <StockLink symbol={stock.symbol} name={stock.name} />
                  </TableCell>
                  <TableCell>
                    <MarketBadge market={stock.market} />
                  </TableCell>
                  <TableCell>
                    <ScorePills
                      composite={stock.composite}
                      quality={stock.quality.total}
                      valuation={stock.valuation.total}
                    />
                  </TableCell>
                  <TableCell className="max-w-sm text-xs text-muted-foreground whitespace-normal">
                    {stock.connect.implication}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
