"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketBadge, ScorePills, StockLink } from "@/components/research";
import type { Industry, StockBrief, ValueChain } from "@/lib/data";

export function IndustryBoard({
  industries,
  chains,
  stocks,
}: {
  industries: Industry[];
  chains: ValueChain[];
  stocks: StockBrief[];
}) {
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
        <span className="text-sm text-muted-foreground">查行业或产业链，例如 AI、算力、白酒</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="AI / 人工智能 / 动力电池"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">产业链</h2>
        <p className="text-sm text-muted-foreground">
          问「AI 上下游」时看的是利润停在哪一层，不是再写一遍前景广阔。
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {matchedChains.map((chain) => (
            <Card key={chain.id} id={chain.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/chains/${encodeURIComponent(chain.id)}`} className="hover:underline">
                    {chain.name}{" "}
                    <span className="text-sm font-normal text-muted-foreground">{chain.name_en}</span>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{chain.thesis}</p>
                <p className="text-muted-foreground">
                  {chain.layers.map((layer) => layer.role_zh + "·" + layer.industry).join(" → ")}
                </p>
                <Link href={`/chains/${encodeURIComponent(chain.id)}`} className="text-xs text-sky-300 hover:underline">
                  打开分层与个股
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        {matchedChains.length === 0 ? (
          <p className="text-sm text-muted-foreground">没有匹配的产业链。样本地图不是全市场普查。</p>
        ) : null}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">行业切片（{matchedIndustries.length}）</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {matchedIndustries.map((industry) => (
            <Card key={industry.name} id={industry.name}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/industries/${encodeURIComponent(industry.name)}`} className="hover:underline">
                    {industry.name}{" "}
                    <span className="text-sm font-normal text-muted-foreground">{industry.name_en}</span>
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {industry.score.total.toFixed(1)} {industry.score.grade} · {industry.cycle_position}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {industry.markets.map((market) => (
                    <MarketBadge key={market} market={market} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{industry.notes}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {industry.constituents.map((member) => {
                    const brief = stockMap[member.symbol];
                    return (
                      <div key={member.symbol}>
                        <StockLink symbol={member.symbol} name={member.name} />
                        {brief ? (
                          <ScorePills quality={brief.quality.total} valuation={brief.valuation.total} composite={brief.composite} />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <Link
                  href={`/industries/${encodeURIComponent(industry.name)}`}
                  className="text-xs text-sky-300 hover:underline"
                >
                  因子拆解与详情
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
