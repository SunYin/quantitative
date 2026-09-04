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
  snapshot,
} from "@/lib/data";
import { liveDisclaimer, overlayStock, overlayStocks } from "@/server/overlay";

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
};

export type AppRouter = typeof router;
