import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Disclaimer, IpoStatusBadge, MarketBadge, Money, StockLink } from "@/components/research";
import { api } from "@/lib/api";
import { getI18n } from "@/i18n/server";
import { translate } from "@/i18n/engine";

export default async function IposPage() {
  const { locale, t, tx } = await getI18n();
  const [meta, coverage, deals, stocks] = await Promise.all([
    api.meta.get(),
    api.coverage.get(),
    api.ipo.list(),
    api.universe.list(),
  ]);
  const bySymbol = new Map(stocks.map((item) => [item.symbol, item]));
  const markets = new Set(deals.map((deal) => deal.market));

  return (
    <>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("ipos.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("ipos.lead")}</p>
      </div>
      <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <p className="rounded-lg border border-border/80 px-3 py-2 text-sm text-muted-foreground">
        {tx(coverage.ipo_disclaimer)}
      </p>
      <p className="text-sm text-muted-foreground">
        {t("ipos.count", { count: deals.length, markets: [...markets].join(" / ") })}
      </p>
      <Card>
        <CardHeader>
          <CardTitle>{t("ipos.pipeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.market")}</TableHead>
                <TableHead>{t("ipos.status")}</TableHead>
                <TableHead>{t("ipos.date")}</TableHead>
                <TableHead>{t("ipos.proceeds")}</TableHead>
                <TableHead>{t("ipos.comparables")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <Link href={`/ipos/${encodeURIComponent(deal.id)}`} className="hover:underline">
                      {locale === "en" ? deal.name_en : translate(locale, deal.name)}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {locale === "en" ? deal.name : deal.name_en} · {deal.board}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <MarketBadge market={deal.market} />
                      <span className="text-xs text-muted-foreground">{tx(deal.industry)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <IpoStatusBadge locale={locale} status={deal.status} />
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">{deal.expected_date}</TableCell>
                  <TableCell>
                    {deal.proceeds != null ? (
                      <Money locale={locale} value={deal.proceeds} currency={deal.currency} />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs text-xs">
                    <div className="flex flex-col gap-1">
                      {deal.comparables.map((symbol) => {
                        const stock = bySymbol.get(symbol);
                        return stock ? (
                          <StockLink
                            key={symbol}
                            locale={locale}
                            symbol={stock.symbol}
                            name={stock.name}
                            nameEn={stock.name_en}
                          />
                        ) : (
                          <span key={symbol} className="font-mono text-muted-foreground">
                            {symbol}
                          </span>
                        );
                      })}
                    </div>
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
