import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CoverageBoard, CoverageStats } from "@/components/coverage-board";
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

export default async function HomePage() {
  const { locale, t } = await getI18n();
  const [meta, coverage, stocks] = await Promise.all([
    api.meta.get(),
    api.coverage.get(),
    api.universe.list(),
  ]);

  return (
    <>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("home.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("home.subtitle")}</p>
      </div>
      <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <CoverageBoard locale={locale} coverage={coverage} />
      <CoverageStats locale={locale} coverage={coverage} />
      <Card>
        <CardHeader>
          <CardTitle>{t("home.composite")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.market")}</TableHead>
                <TableHead>{t("table.price")}</TableHead>
                <TableHead>{t("table.change")}</TableHead>
                <TableHead>{t("table.score")}</TableHead>
                <TableHead>{t("table.positionCap")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => (
                <TableRow key={stock.symbol}>
                  <TableCell>
                    <StockLink locale={locale} symbol={stock.symbol} name={stock.name} nameEn={stock.name_en} />
                    <div className="text-xs text-muted-foreground">
                      {locale === "en" ? stock.name : stock.name_en}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
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
