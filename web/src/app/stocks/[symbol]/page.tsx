import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChangePct,
  Disclaimer,
  FactorList,
  FieldSource,
  MarketBadge,
  Money,
  SourceBadge,
  multiple,
  pct,
} from "@/components/research";
import { api } from "@/lib/api";
import { getI18n } from "@/i18n/server";

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const { locale, t, tx, name } = await getI18n();
  let stock;
  try {
    stock = await api.stock.get({ symbol });
  } catch {
    notFound();
  }
  const [meta, industries] = await Promise.all([api.meta.get(), api.industry.list()]);
  const fields = stock.quote.fields;
  const home =
    industries.find((item) => item.name === stock.industry) ??
    industries.find((item) => item.constituents.some((row) => row.symbol === stock.symbol));
  const industryName = home?.name ?? stock.industry;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {name(stock.name, stock.name_en)}{" "}
            <span className="font-mono text-lg text-muted-foreground">{stock.symbol}</span>
          </h1>
          <p className="text-muted-foreground">{locale === "en" ? stock.name : stock.name_en}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <MarketBadge market={stock.market} />
          <SourceBadge locale={locale} source={stock.quote.source} />
        </div>
      </div>
      <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <p className="text-sm text-muted-foreground">{tx(stock.connect.implication)}</p>
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("stock.quotePosition")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-3xl font-semibold">
              <Money locale={locale} value={stock.price} currency={stock.currency} />
              <FieldSource locale={locale} source={fields.price} />
            </p>
            <p>
              {t("stock.change")} <ChangePct value={stock.change_pct} />
              <FieldSource locale={locale} source={fields.change_pct} />
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {stock.composite.toFixed(1)} {t("stock.composite")}
            </p>
            <p>
              {t("stock.positionCap")} {(stock.position_cap * 100).toFixed(1)}%
            </p>
            <p>
              {t("stock.industry")}{" "}
              <Link href={`/industries/${encodeURIComponent(industryName)}`} className="hover:underline">
                {name(industryName, home?.name_en)}
              </Link>{" "}
              · {stock.board}
            </p>
            <p>
              PE {multiple(stock.pe_ttm)}
              <FieldSource locale={locale} source={fields.pe_ttm} />
              {" · "}PB {multiple(stock.pb)}
              <FieldSource locale={locale} source={fields.pb} />
            </p>
            <p>
              {t("stock.dividend")} {pct(stock.dividend_yield)}
              <FieldSource locale={locale} source={fields.dividend_yield} />
              {" · "}ROE {pct(stock.roe)}
              <FieldSource locale={locale} source={fields.roe} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {t("stock.quality")} {stock.quality.grade}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FactorList locale={locale} score={stock.quality} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {t("stock.valuation")} {stock.valuation.grade}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FactorList locale={locale} score={stock.valuation} />
          </CardContent>
        </Card>
      </section>
      {stock.notes ? <p className="text-sm text-muted-foreground">{tx(stock.notes)}</p> : null}
    </>
  );
}
