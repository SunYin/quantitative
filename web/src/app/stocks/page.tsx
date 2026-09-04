import { CoverageBoard } from "@/components/coverage-board";
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
import { getI18n } from "@/i18n/server";

export default async function StocksPage() {
  const { locale, t, tx } = await getI18n();
  const [meta, coverage, stocks] = await Promise.all([
    api.meta.get(),
    api.coverage.get(),
    api.universe.list(),
  ]);
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{t("stocks.title")}</h1>
      <p className="text-muted-foreground">{t("stocks.lead")}</p>
      <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <CoverageBoard locale={locale} coverage={coverage} />
      <Card>
        <CardHeader>
          <CardTitle>{t("stocks.universe")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.symbol")}</TableHead>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.price")}</TableHead>
                <TableHead>{t("table.change")}</TableHead>
                <TableHead>{t("table.score")}</TableHead>
                <TableHead>{t("table.connect")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => (
                <TableRow key={stock.symbol}>
                  <TableCell className="font-mono text-xs">{stock.symbol}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <StockLink locale={locale} symbol={stock.symbol} name={stock.name} nameEn={stock.name_en} />
                      <MarketBadge market={stock.market} />
                      <SourceBadge locale={locale} source={stock.quote.source} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Money locale={locale} value={stock.price} currency={stock.currency} />
                  </TableCell>
                  <TableCell>
                    <ChangePct value={stock.change_pct} />
                  </TableCell>
                  <TableCell>
                    <ScorePills
                      locale={locale}
                      composite={stock.composite}
                      quality={stock.quality.total}
                      valuation={stock.valuation.total}
                    />
                  </TableCell>
                  <TableCell className="max-w-sm text-xs text-muted-foreground whitespace-normal">
                    {tx(stock.connect.implication)}
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
