import { ORPCError, os } from "@orpc/server";
import { z } from "zod";
import {
  getIndustry,
  getReport,
  getStock,
  listIndustries,
  listReports,
  listStocks,
  listStrategies,
  listChains,
  getChain,
  getCoverage,
  listIpos,
  getIpo,
  searchStocks,
  snapshot,
  type LiveQuote,
  type StockLookup,
} from "@/lib/data";
import { liveDisclaimer, overlayStock, overlayStocks } from "@/server/overlay";
import { fetchChart, lookupYahooIdentity, toYahooSymbol } from "@/server/yahoo";
import { CHART_SPECS, RANGE_DAYS, sampleCandles, type ChartRange } from "@/lib/candles";
import { guessCurrency, guessListing } from "@/lib/ticker";

export const router = {
  meta: {
    get: os.handler(async () => {
      const stocks = await overlayStocks(listStocks());
      const { text, live } = liveDisclaimer(stocks);
      return {
        as_of: snapshot.as_of,
        disclaimer: text,
        live,
        checklist: snapshot.checklist,
        connect: snapshot.connect,
      };
    }),
  },
  universe: {
    list: os.handler(async () => overlayStocks(listStocks())),
  },
  stock: {
    get: os
      .input(z.object({ symbol: z.string().min(1) }))
      .handler(async ({ input }) => {
        const stock = getStock(input.symbol);
        if (!stock) {
          throw new ORPCError("NOT_FOUND", { message: `未知代码：${input.symbol}` });
        }
        return overlayStock(stock);
      }),
    lookup: os
      .input(z.object({ query: z.string().min(1) }))
      .handler(async ({ input }): Promise<StockLookup> => {
        const query = decodeURIComponent(input.query).trim();
        const suggestions = searchStocks(query);
        const sample = getStock(query);
        if (sample) {
          return { kind: "sample", query, stock: await overlayStock(sample), suggestions };
        }
        const live = await lookupYahooIdentity(query);
        if (live) {
          const listing = guessListing(live.symbol, live.exchange);
          const quote: LiveQuote = {
            symbol: live.symbol,
            name: live.name,
            name_en: live.nameEn,
            market: listing.market,
            board: listing.board,
            currency: live.currency,
            exchange: live.exchange,
            price: live.quote.price ?? null,
            change_pct: live.quote.changePct ?? null,
            pe_ttm: live.quote.peTtm ?? null,
            pb: live.quote.pb ?? null,
            dividend_yield: live.quote.dividendYield ?? null,
            as_of: live.quote.asOf ?? null,
          };
          return { kind: "live", query, quote, suggestions };
        }
        return { kind: "miss", query, suggestions };
      }),
    search: os
      .input(z.object({ query: z.string() }))
      .handler(({ input }) => searchStocks(input.query)),
    chart: os
      .input(
        z.object({
          symbol: z.string().min(1),
          range: z.enum(["intraday", "1d", "5d", "1m", "3m", "6m", "1y", "5y"]).default("6m"),
        }),
      )
      .handler(async ({ input }) => {
        const stock = getStock(input.symbol);
        const range = input.range as ChartRange;
        const spec = CHART_SPECS[range];
        if (stock) {
          const overlaid = await overlayStock(stock);
          let source: "yahoo" | "sample" = "sample";
          let candles = [] as ReturnType<typeof sampleCandles>;
          let previousClose: number | null = null;
          let lastPrice: number | null = overlaid.price ?? null;
          let asOf: string | null = overlaid.quote.as_of ?? null;
          try {
            const live = await fetchChart(stock.symbol, range);
            if (live.candles.length >= spec.minBars) {
              candles = live.candles;
              source = "yahoo";
              previousClose = live.previousClose;
              lastPrice = live.lastPrice ?? lastPrice;
              asOf = live.asOf ?? asOf;
            }
          } catch {
            candles = [];
          }
          if (source !== "yahoo") {
            candles = spec.sampleFallback
              ? sampleCandles(stock.symbol, overlaid.price, RANGE_DAYS[range])
              : [];
          }
          const changePct =
            overlaid.change_pct ??
            (lastPrice != null && previousClose ? lastPrice / previousClose - 1 : null);
          return {
            symbol: stock.symbol,
            market: stock.market,
            currency: overlaid.currency,
            range,
            style: spec.style,
            interval: spec.interval,
            source,
            candles,
            previousClose,
            lastPrice,
            changePct,
            asOf,
          };
        }
        let candles = [] as ReturnType<typeof sampleCandles>;
        let previousClose: number | null = null;
        let lastPrice: number | null = null;
        let asOf: string | null = null;
        try {
          const live = await fetchChart(input.symbol, range);
          candles = live.candles;
          previousClose = live.previousClose;
          lastPrice = live.lastPrice;
          asOf = live.asOf;
        } catch {
          candles = [];
        }
        const listing = guessListing(input.symbol);
        const changePct = lastPrice != null && previousClose ? lastPrice / previousClose - 1 : null;
        return {
          symbol: toYahooSymbol(input.symbol),
          market: listing.market,
          currency: guessCurrency(input.symbol, listing.market),
          range,
          style: spec.style,
          interval: spec.interval,
          source: "yahoo" as const,
          candles,
          previousClose,
          lastPrice,
          changePct,
          asOf,
        };
      }),
  },
  industry: {
    list: os.handler(() => listIndustries()),
    get: os
      .input(z.object({ name: z.string().min(1) }))
      .handler(({ input }) => {
        const industry = getIndustry(input.name);
        if (!industry) {
          throw new ORPCError("NOT_FOUND", { message: `未知行业：${input.name}` });
        }
        return industry;
      }),
  },
  chain: {
    list: os.handler(() => listChains()),
    get: os
      .input(z.object({ id: z.string().min(1) }))
      .handler(({ input }) => {
        const chain = getChain(input.id);
        if (!chain) {
          throw new ORPCError("NOT_FOUND", { message: `未知产业链：${input.id}` });
        }
        return chain;
      }),
  },
  strategy: {
    list: os.handler(() => listStrategies()),
  },
  report: {
    list: os.handler(() => listReports()),
    get: os
      .input(z.object({ id: z.string().min(1) }))
      .handler(({ input }) => {
        const report = getReport(input.id);
        if (!report) {
          throw new ORPCError("NOT_FOUND", { message: `未知研报：${input.id}` });
        }
        return report;
      }),
  },
  market: {
    list: os.handler(() => snapshot.markets),
  },
  coverage: {
    get: os.handler(() => {
      const coverage = getCoverage();
      if (!coverage) {
        throw new ORPCError("NOT_FOUND", { message: "覆盖数据未导出" });
      }
      return coverage;
    }),
  },
  ipo: {
    list: os.handler(() => listIpos()),
    get: os
      .input(z.object({ id: z.string().min(1) }))
      .handler(({ input }) => {
        const deal = getIpo(input.id);
        if (!deal) {
          throw new ORPCError("NOT_FOUND", { message: `未知 IPO：${input.id}` });
        }
        return deal;
      }),
  },
};

export type AppRouter = typeof router;
