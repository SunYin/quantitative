import { CoverageBoard } from "@/components/coverage-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer, MarketBadge } from "@/components/research";
import { api } from "@/lib/api";
import { getI18n } from "@/i18n/server";

export default async function MarketsPage() {
  const { locale, t, tx } = await getI18n();
  const [meta, coverage, markets] = await Promise.all([
    api.meta.get(),
    api.coverage.get(),
    api.market.list(),
  ]);
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{t("markets.title")}</h1>
      <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <CoverageBoard locale={locale} coverage={coverage} />
      <div className="grid gap-4 md:grid-cols-3">
        {markets.map((market) => (
          <Card key={market.market}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MarketBadge market={market.market} />
                <span>{market.currency}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                {t("markets.settlement")}：{tx(market.settlement)}
              </p>
              <p>
                {t("markets.limit")}：{tx(market.price_limit)}
              </p>
              <p>
                {t("markets.shorting")}：{tx(market.shorting)}
              </p>
              <p>
                {t("markets.flows")}：{tx(market.key_flows)}
              </p>
              <p>
                {t("markets.valuation")}：{tx(market.valuation_habit)}
              </p>
              <p>
                {t("markets.taxonomy")}：{tx(market.industry_taxonomy)}
              </p>
              <p>
                {t("markets.governance")}：{market.governance_focus.map((item) => tx(item)).join("；")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("markets.connect")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">{t("markets.south")}</strong>：{tx(meta.connect.southbound_name)}。
            {tx(meta.connect.eligibility_southbound)}
          </p>
          <p>
            <strong className="text-foreground">{t("markets.north")}</strong>：{tx(meta.connect.northbound_name)}。
            {tx(meta.connect.eligibility_northbound)}
          </p>
          <p>{tx(meta.connect.quota_note)}</p>
          <p>{tx(meta.connect.practical_edge)}</p>
          <p>{t("markets.connectClosed")}</p>
        </CardContent>
      </Card>
    </>
  );
}
