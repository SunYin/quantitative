import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer, FactorList, MarketBadge } from "@/components/research";
import { api } from "@/lib/api";

export default async function IndustriesPage() {
  const [meta, industries] = await Promise.all([api.meta.get(), api.industry.list()]);
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">行业吸引力</h1>
      <Disclaimer text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <div className="grid gap-4 lg:grid-cols-2">
        {industries.map((industry) => (
          <Card key={industry.name} id={industry.name}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {industry.name}{" "}
                  <span className="text-sm font-normal text-muted-foreground">{industry.name_en}</span>
                </span>
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
              <FactorList score={industry.score} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
