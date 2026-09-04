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
  snapshot,
} from "@/lib/data";
import { liveDisclaimer, overlayStock, overlayStocks } from "@/server/overlay";
import { fetchChart } from "@/server/yahoo";
import { RANGE_DAYS, sampleCandles, type ChartRange } from "@/lib/candles";

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
    chart: os
      .input(
        z.object({
          symbol: z.string().min(1),
          range: z.enum(["1m", "3m", "6m", "1y"]).default("6m"),
        }),
      )
      .handler(async ({ input }) => {
        const stock = getStock(input.symbol);
        if (!stock) {
          throw new ORPCError("NOT_FOUND", { message: `未知代码：${input.symbol}` });
        }
        const overlaid = await overlayStock(stock);
        const range = input.range as ChartRange;
        let source: "yahoo" | "sample" = "sample";
        let candles = [] as ReturnType<typeof sampleCandles>;
        try {
          const live = await fetchChart(stock.symbol, range);
          if (live.length >= 8) {
            candles = live;
            source = "yahoo";
          }
        } catch {
          candles = [];
        }
        if (source !== "yahoo") {
          candles = sampleCandles(stock.symbol, overlaid.price, RANGE_DAYS[range]);
        }
        return {
          symbol: stock.symbol,
          market: stock.market,
          currency: overlaid.currency,
          range,
          source,
          candles,
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
