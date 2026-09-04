import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChainMermaid } from "@/components/chain-mermaid";
import { CycleMeter } from "@/components/cycle-meter";
import { Disclaimer, FactorList, MarketBadge, ScorePills, StockLink } from "@/components/research";
import { api } from "@/lib/api";
import { getI18n } from "@/i18n/server";

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: raw } = await params;
  const { locale, t, tx, name } = await getI18n();
  let industry;
  try {
    industry = await api.industry.get({ name: raw });
  } catch {
    notFound();
  }
  const [meta, stocks, chains] = await Promise.all([
    api.meta.get(),
    api.universe.list(),
    api.chain.list(),
  ]);
  const related = chains.filter((chain) => chain.layers.some((layer) => layer.industry === industry.name));
  const stockMap = Object.fromEntries(stocks.map((item) => [item.symbol, item]));

  return (
    <>
      <p className="text-sm">
        <Link href="/industries" className="text-muted-foreground hover:underline">
          {t("industries.back")}
        </Link>
      </p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{name(industry.name, industry.name_en)}</h1>
          <p className="text-muted-foreground">{locale === "en" ? industry.name : industry.name_en}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {industry.score.total.toFixed(1)} {industry.score.grade}
        </p>
      </div>
      <CycleMeter position={industry.cycle_position} />
      <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <div className="flex flex-wrap gap-1">
        {industry.markets.map((market) => (
          <MarketBadge key={market} market={market} />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{tx(industry.notes)}</p>
      {related.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm">
            {t("industries.related")}
            {related.map((chain) => (
              <Link
                key={chain.id}
                href={`/chains/${encodeURIComponent(chain.id)}`}
                className="mr-2 text-sky-300 hover:underline"
              >
                {name(chain.name, chain.name_en)}
              </Link>
            ))}
          </p>
          {related.map((chain) => (
            <ChainMermaid key={chain.id} chain={chain} compact />
          ))}
        </div>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("industries.constituents")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {industry.constituents.map((member) => {
              const brief = stockMap[member.symbol];
              return (
                <div key={member.symbol} className="rounded-lg border border-border/80 p-3">
                  <StockLink locale={locale} symbol={member.symbol} name={member.name} nameEn={member.name_en} />
                  <div className="mt-1 text-xs text-muted-foreground">
                    {locale === "en" ? member.name : member.name_en} · {member.market}
                  </div>
                  {brief ? (
                    <div className="mt-2">
                      <ScorePills
                        locale={locale}
                        composite={brief.composite}
                        quality={brief.quality.total}
                        valuation={brief.valuation.total}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("industries.factors")}</CardTitle>
          </CardHeader>
          <CardContent>
            <FactorList locale={locale} score={industry.score} />
          </CardContent>
        </Card>
      </section>
    </>
  );
}
