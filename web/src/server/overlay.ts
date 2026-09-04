import type { LiveSource, LiveSummary, QuoteMeta, StockBrief } from "@/lib/data";
import { snapshot } from "@/lib/data";
import { fetchLiveQuotes, type LiveFields } from "@/server/yahoo";

const SAMPLE_FIELDS: QuoteMeta["fields"] = {
  price: "sample",
  change_pct: "sample",
  pe_ttm: "sample",
  pb: "sample",
  dividend_yield: "sample",
  roe: "sample",
};

export async function overlayStocks(stocks: StockBrief[]): Promise<StockBrief[]> {
  try {
    const quotes = await fetchLiveQuotes(stocks.map((stock) => stock.symbol));
    return stocks.map((stock) => mergeQuote(stock, quotes[stock.symbol]));
  } catch {
    return stocks.map((stock) => mergeQuote(stock));
  }
}

export async function overlayStock(stock: StockBrief): Promise<StockBrief> {
  const [overlaid] = await overlayStocks([stock]);
  return overlaid;
}

export function liveDisclaimer(stocks: StockBrief[]): { text: string; live: LiveSummary } {
  const applied = stocks.filter((stock) => stock.quote.source !== "sample").length;
  const quotes: LiveSummary["quotes"] =
    applied === 0 ? "sample" : applied === stocks.length ? "yahoo" : "mixed";
  const scores: LiveSummary["scores"] = snapshot.live?.rescored ? "live-rescored" : "sample";
  const fetched_at =
    stocks.find((stock) => stock.quote.as_of)?.quote.as_of ?? snapshot.live?.fetched_at ?? null;
  const live: LiveSummary = {
    quotes,
    scores,
    fetched_at,
    applied,
    failed: stocks.length - applied,
  };

  const scoreText =
    scores === "live-rescored"
      ? "质量/估值分来自 CLI --live 覆盖后重算"
      : "质量、估值与策略分仍基于研究样本财务，前端不重算打分";
  const quoteText =
    quotes === "sample"
      ? "现价与基本面暂用研究样本（Yahoo 不可用或超时）"
      : "现价、涨跌及部分 PE/PB/股息/ROE 在可获取时来自 Yahoo Finance（约 60 秒缓存）";
  return {
    text: `${quoteText}；${scoreText}。样本与实时数据均不构成投资建议。`,
    live,
  };
}

function mergeQuote(stock: StockBrief, quote?: LiveFields): StockBrief {
  const fields: QuoteMeta["fields"] = { ...(stock.quote?.fields ?? SAMPLE_FIELDS) };
  const next: StockBrief = {
    ...stock,
    quote: stock.quote ?? { source: "sample", as_of: null, fields: SAMPLE_FIELDS },
  };
  if (!quote) return next;
  if (quote.price != null) {
    next.price = quote.price;
    fields.price = "yahoo";
  }
  if (quote.changePct != null) {
    next.change_pct = quote.changePct;
    fields.change_pct = "yahoo";
  }
  if (quote.peTtm != null) {
    next.pe_ttm = quote.peTtm;
    fields.pe_ttm = "yahoo";
  }
  if (quote.pb != null) {
    next.pb = quote.pb;
    fields.pb = "yahoo";
  }
  if (quote.dividendYield != null) {
    next.dividend_yield = quote.dividendYield;
    fields.dividend_yield = "yahoo";
  }
  if (quote.roe != null) {
    next.roe = quote.roe;
    fields.roe = "yahoo";
  }
  next.quote = {
    source: sourceFrom(fields),
    as_of: quote.asOf ?? stock.quote?.as_of ?? null,
    fields,
  };
  return next;
}

function sourceFrom(fields: QuoteMeta["fields"]): QuoteMeta["source"] {
  const values = Object.values(fields) as LiveSource[];
  const yahoo = values.filter((value) => value === "yahoo").length;
  if (yahoo === 0) return "sample";
  if (yahoo === values.length) return "yahoo";
  return "mixed";
}
