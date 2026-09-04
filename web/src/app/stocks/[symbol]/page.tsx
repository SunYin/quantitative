import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChangePct,
  Disclaimer,
  FactorList,
  FieldSource,
  MarketBadge,
  Money,
  SourceBadge,
  StockLink,
  multiple,
  pct,
} from "@/components/research";
import { KlineChart } from "@/components/kline-chart";
import { TickerSearch } from "@/components/ticker-search";
import { api } from "@/lib/api";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";
import { sampleTickers, type LiveQuote, type StockBrief } from "@/lib/data";

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const { locale, t, tx, name } = await getI18n();
  const query = decodeURIComponent(symbol).trim();
  const [lookup, meta] = await Promise.all([api.stock.lookup({ query }), api.meta.get()]);

  if (lookup.kind === "sample" && lookup.stock.symbol !== query) {
    redirect(`/stocks/${encodeURIComponent(lookup.stock.symbol)}`);
  }
  if (lookup.kind === "live" && lookup.quote.symbol !== query) {
    redirect(`/stocks/${encodeURIComponent(lookup.quote.symbol)}`);
  }

  if (lookup.kind === "miss") {
    return (
      <>
        <h1 className="text-3xl font-semibold tracking-tight">{t("stock.notFound")}</h1>
        <p className="text-muted-foreground">
          <span className="font-mono">{query}</span> · {t("stock.notFoundLead")}
        </p>
        <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
        <TickerSearch samples={sampleTickers()} size="page" />
        {lookup.suggestions.length > 0 ? (
          <SuggestionList locale={locale} title={t("stock.trySample")} suggestions={lookup.suggestions} />
        ) : null}
      </>
    );
  }

  if (lookup.kind === "live") {
    const quote = lookup.quote;
    const chart = await api.stock.chart({ symbol: quote.symbol, range: "6m" });
    return (
      <>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {name(quote.name, quote.name_en)}{" "}
              <span className="font-mono text-lg text-muted-foreground">{quote.symbol}</span>
            </h1>
            <p className="text-muted-foreground">{t("stock.liveOnly")}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <MarketBadge market={quote.market} />
            <SourceBadge locale={locale} source="yahoo" />
          </div>
        </div>
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {t("stock.liveOnlyLead")}
        </p>
        <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
        <TickerSearch samples={sampleTickers()} size="page" />
        <Card>
          <CardContent className="pt-6">
            <KlineChart initial={chart} />
          </CardContent>
        </Card>
        <LiveQuoteCard locale={locale} quote={quote} title={t("stock.quoteOnly")} changeLabel={t("stock.change")} />
      </>
    );
  }

  const stock = lookup.stock;
  const [industries, chart] = await Promise.all([
    api.industry.list(),
    api.stock.chart({ symbol: stock.symbol, range: "6m" }),
  ]);
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
      <Card>
        <CardContent className="pt-6">
          <KlineChart initial={chart} />
        </CardContent>
      </Card>
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

function LiveQuoteCard({
  locale,
  quote,
  title,
  changeLabel,
}: {
  locale: Locale;
  quote: LiveQuote;
  title: string;
  changeLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-3xl font-semibold">
          {quote.price != null ? <Money locale={locale} value={quote.price} currency={quote.currency} /> : "—"}
          <FieldSource locale={locale} source="yahoo" />
        </p>
        <p>
          {changeLabel} <ChangePct value={quote.change_pct} />
          <FieldSource locale={locale} source="yahoo" />
        </p>
        <p>
          {quote.board}
          {quote.exchange ? ` · ${quote.exchange}` : ""} · {quote.currency}
        </p>
        <p>
          PE {multiple(quote.pe_ttm)}
          <FieldSource locale={locale} source="yahoo" />
          {" · "}PB {multiple(quote.pb)}
          <FieldSource locale={locale} source="yahoo" />
        </p>
        <p>
          {t(locale, "stock.dividend")} {pct(quote.dividend_yield)}
          <FieldSource locale={locale} source="yahoo" />
        </p>
      </CardContent>
    </Card>
  );
}

function SuggestionList({
  locale,
  title,
  suggestions,
}: {
  locale: Locale;
  title: string;
  suggestions: StockBrief[];
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm text-muted-foreground">{title}</h2>
      <ul className="flex flex-wrap gap-2 text-sm">
        {suggestions.map((item) => (
          <li key={item.symbol}>
            <StockLink locale={locale} symbol={item.symbol} name={item.name} nameEn={item.name_en} />
          </li>
        ))}
      </ul>
    </section>
  );
}
