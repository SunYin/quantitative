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
  snapshot,
} from "@/lib/data";

export const router = {
  meta: {
    get: os.handler(() => ({
      as_of: snapshot.as_of,
      disclaimer: snapshot.disclaimer,
      checklist: snapshot.checklist,
      connect: snapshot.connect,
    })),
  },
  universe: {
    list: os.handler(() => listStocks()),
  },
  stock: {
    get: os
      .input(z.object({ symbol: z.string().min(1) }))
      .handler(({ input }) => {
        const stock = getStock(input.symbol);
        if (!stock) {
          throw new ORPCError("NOT_FOUND", { message: `未知代码：${input.symbol}` });
        }
        return stock;
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
