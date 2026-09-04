import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer, IpoStatusBadge, MarketBadge, Money, StockLink } from "@/components/research";
import { api } from "@/lib/api";
import { getI18n } from "@/i18n/server";
import { translate } from "@/i18n/engine";

export default async function IpoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { locale, t, tx } = await getI18n();
  let deal;
  try {
    deal = await api.ipo.get({ id });
  } catch {
    notFound();
  }
  const [meta, coverage, stocks] = await Promise.all([
    api.meta.get(),
    api.coverage.get(),
    api.universe.list(),
  ]);
  const bySymbol = new Map(stocks.map((item) => [item.symbol, item]));
  const listed = deal.listed_symbol ? bySymbol.get(deal.listed_symbol) : undefined;

  return (
    <>
      <Link href="/ipos" className="text-sm text-muted-foreground hover:underline">
        {t("ipos.back")}
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {locale === "en" ? deal.name_en : translate(locale, deal.name)}
        </h1>
        <MarketBadge market={deal.market} />
        <IpoStatusBadge locale={locale} status={deal.status} />
      </div>
      <p className="text-muted-foreground">
        {locale === "en" ? deal.name : deal.name_en} · {deal.board} · {tx(deal.industry)}
      </p>
      <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <p className="rounded-lg border border-border/80 px-3 py-2 text-sm text-muted-foreground">
        {tx(coverage.ipo_disclaimer)}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("ipos.calendar")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              {t("ipos.date")}：<span className="text-foreground tabular-nums">{deal.expected_date}</span>
            </p>
            <p>
              {t("ipos.proceeds")}：
              {deal.proceeds != null ? (
                <Money locale={locale} value={deal.proceeds} currency={deal.currency} />
              ) : (
                "—"
              )}
            </p>
            <p>
              {t("ipos.sponsor")}：{tx(deal.sponsor)}
            </p>
            {listed ? (
              <p>
                {t("ipos.listedAs")}：
                <StockLink locale={locale} symbol={listed.symbol} name={listed.name} nameEn={listed.name_en} />
              </p>
            ) : (
              <p>{t("ipos.notScored")}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("ipos.comparables")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {deal.comparables.map((symbol) => {
              const stock = bySymbol.get(symbol);
              return stock ? (
                <div key={symbol}>
                  <StockLink locale={locale} symbol={stock.symbol} name={stock.name} nameEn={stock.name_en} />
                </div>
              ) : (
                <p key={symbol} className="font-mono text-muted-foreground">
                  {symbol}
                </p>
              );
            })}
            {deal.chain_id ? (
              <p className="pt-2 text-muted-foreground">
                {t("industries.related")}
                <Link href={`/chains/${encodeURIComponent(deal.chain_id)}`} className="hover:underline">
                  {deal.chain_id}
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("ipos.notes")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{tx(deal.notes)}</CardContent>
      </Card>
    </>
  );
}
