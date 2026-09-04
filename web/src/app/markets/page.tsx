import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer, MarketBadge } from "@/components/research";
import { api } from "@/lib/api";

export default async function MarketsPage() {
  const [meta, markets] = await Promise.all([api.meta.get(), api.market.list()]);
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">市场规则</h1>
      <Disclaimer text={meta.disclaimer} asOf={meta.as_of} />
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
              <p>结算：{market.settlement}</p>
              <p>涨跌停：{market.price_limit}</p>
              <p>空头：{market.shorting}</p>
              <p>资金：{market.key_flows}</p>
              <p>估值：{market.valuation_habit}</p>
              <p>分类：{market.industry_taxonomy}</p>
              <p>治理：{market.governance_focus.join("；")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>互联互通</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">南向港股通</strong>：{meta.connect.southbound_name}。
            {meta.connect.eligibility_southbound}
          </p>
          <p>
            <strong className="text-foreground">北向沪深股通</strong>：{meta.connect.northbound_name}。
            {meta.connect.eligibility_northbound}
          </p>
          <p>{meta.connect.quota_note}</p>
          <p>{meta.connect.practical_edge}</p>
          <p>这是名单 + 额度 + 闭环换汇，不是全市场开放。</p>
        </CardContent>
      </Card>
    </>
  );
}
