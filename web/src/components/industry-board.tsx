"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChainMermaid } from "@/components/chain-mermaid";
import { CycleMeter } from "@/components/cycle-meter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketBadge, ScorePills, StockLink } from "@/components/research";
import type { Industry, StockBrief, ValueChain } from "@/lib/data";
import { useI18n } from "@/components/locale-provider";

export function IndustryBoard({
  industries,
  chains,
  stocks,
}: {
  industries: Industry[];
  chains: ValueChain[];
  stocks: StockBrief[];
}) {
  const { locale, t, tx, name } = useI18n();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase().replace(/[\s_-]/g, "");
  const stockMap = useMemo(
    () => Object.fromEntries(stocks.map((item) => [item.symbol, item])),
    [stocks],
  );

  const matchedChains = chains.filter((chain) => {
    if (!needle) return true;
    const labels = [chain.id, chain.name, chain.name_en, ...chain.aliases];
    return labels.some((label) => label.toLowerCase().replace(/[\s_-]/g, "").includes(needle));
  });
  const matchedIndustries = industries.filter((industry) => {
    if (!needle) return true;
    const labels = [industry.name, industry.name_en, ...(industry.aliases ?? [])];
    return labels.some((label) => label.toLowerCase().replace(/[\s_-]/g, "").includes(needle));
  });

  return (
    <>
      <label className="block">
        <span className="text-sm text-muted-foreground">{t("industries.searchLabel")}</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("industries.searchPlaceholder")}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("industries.chains")}</h2>
        <p className="text-sm text-muted-foreground">{t("industries.chainHint")}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {matchedChains.map((chain) => (
            <Card key={chain.id} id={chain.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/chains/${encodeURIComponent(chain.id)}`} className="hover:underline">
                    {name(chain.name, chain.name_en)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {locale === "en" ? chain.name : chain.name_en}
                    </span>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{tx(chain.thesis)}</p>
                <ChainMermaid chain={chain} compact />
                <p className="text-muted-foreground">
                  {chain.layers
                    .map((layer) => `${t(`role.${layer.role}`)}·${name(layer.industry, layer.industry_en)}`)
                    .join(" → ")}
                </p>
                <Link href={`/chains/${encodeURIComponent(chain.id)}`} className="text-xs text-sky-300 hover:underline">
                  {t("industries.openChain")}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        {matchedChains.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("industries.noChain")}</p>
        ) : null}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("industries.slicesCount", { count: matchedIndustries.length })}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {matchedIndustries.map((industry) => (
            <Card key={industry.name} id={industry.name}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/industries/${encodeURIComponent(industry.name)}`} className="hover:underline">
                    {name(industry.name, industry.name_en)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {locale === "en" ? industry.name : industry.name_en}
                    </span>
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {industry.score.total.toFixed(1)} {industry.score.grade}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CycleMeter position={industry.cycle_position} />
                <div className="flex flex-wrap gap-1">
                  {industry.markets.map((market) => (
                    <MarketBadge key={market} market={market} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{tx(industry.notes)}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {industry.constituents.map((member) => {
                    const brief = stockMap[member.symbol];
                    return (
                      <div key={member.symbol}>
                        <StockLink locale={locale} symbol={member.symbol} name={member.name} nameEn={member.name_en} />
                        {brief ? (
                          <ScorePills
                            locale={locale}
                            quality={brief.quality.total}
                            valuation={brief.valuation.total}
                            composite={brief.composite}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <Link
                  href={`/industries/${encodeURIComponent(industry.name)}`}
                  className="text-xs text-sky-300 hover:underline"
                >
                  {t("industries.detail")}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
