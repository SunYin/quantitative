import YahooFinance from "yahoo-finance2";

export type LiveFields = {
  price?: number;
  changePct?: number;
  peTtm?: number;
  pb?: number;
  dividendYield?: number;
  roe?: number;
  asOf?: string;
};

type YahooClient = {
  quote: (query: string | string[], opts?: Record<string, unknown>) => Promise<unknown>;
  quoteSummary?: (query: string, opts?: Record<string, unknown>) => Promise<unknown>;
};

type YahooCtor = new (opts?: Record<string, unknown>) => YahooClient;

const TTL_MS = 60_000;
const QUOTE_TIMEOUT_MS = 8_000;
const FUND_TIMEOUT_MS = 5_000;

let cache: { at: number; quotes: Record<string, LiveFields> } | null = null;
let inflight: Promise<Record<string, LiveFields>> | null = null;

export function toYahooSymbol(symbol: string): string {
  const raw = symbol.trim().toUpperCase();
  const hk = raw.match(/^(\d+)\.HK$/);
  if (hk) {
    return `${Number.parseInt(hk[1], 10).toString().padStart(4, "0")}.HK`;
  }
  return raw;
}

export async function fetchLiveQuotes(symbols: string[]): Promise<Record<string, LiveFields>> {
  if (symbols.length === 0) return {};
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return {};
  }
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) {
    return cache.quotes;
  }
  if (!inflight) {
    inflight = loadQuotes(symbols)
      .catch(() => cache?.quotes ?? {})
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

function getClient(): YahooClient {
  const imported = YahooFinance as unknown;
  if (typeof imported === "function") {
    try {
      return new (imported as unknown as YahooCtor)({ suppressNotices: ["yahooSurvey"] });
    } catch {
      return imported as unknown as YahooClient;
    }
  }
  return imported as YahooClient;
}

async function loadQuotes(symbols: string[]): Promise<Record<string, LiveFields>> {
  const yahooSymbols = [...new Set(symbols.map(toYahooSymbol))];
  const oursByYahoo = new Map<string, string>();
  for (const symbol of symbols) {
    oursByYahoo.set(toYahooSymbol(symbol), symbol);
  }

  const client = getClient();
  const rawQuotes = await withTimeout(quoteMany(client, yahooSymbols), QUOTE_TIMEOUT_MS);
  const quotes: Record<string, LiveFields> = {};
  for (const [yahooSymbol, payload] of Object.entries(rawQuotes)) {
    const ours = oursByYahoo.get(yahooSymbol) ?? matchOurs(yahooSymbol, oursByYahoo);
    if (!ours || !payload) continue;
    const parsed = parseQuote(payload);
    if (parsed) quotes[ours] = parsed;
  }

  try {
    await withTimeout(fillRoe(client, quotes, oursByYahoo), FUND_TIMEOUT_MS);
  } catch {
    // ROE is best-effort; price/PE/PB/div already overlayed.
  }

  cache = { at: Date.now(), quotes };
  return quotes;
}

async function quoteMany(client: YahooClient, symbols: string[]): Promise<Record<string, unknown>> {
  try {
    const result = await client.quote(symbols, { return: "object" });
    const normalized = normalizeQuotes(result);
    if (Object.keys(normalized).length > 0) return normalized;
  } catch {
    // fall through to per-symbol
  }
  const settled = await Promise.allSettled(symbols.map((symbol) => client.quote(symbol)));
  const out: Record<string, unknown> = {};
  for (const item of settled) {
    if (item.status !== "fulfilled" || !item.value) continue;
    const payload = item.value as { symbol?: string };
    const key = typeof payload.symbol === "string" ? payload.symbol : "";
    if (key) out[key] = item.value;
  }
  return out;
}

function normalizeQuotes(result: unknown): Record<string, unknown> {
  if (!result) return {};
  if (Array.isArray(result)) {
    return Object.fromEntries(
      result
        .filter((row): row is { symbol?: string } => Boolean(row && typeof row === "object"))
        .map((row) => [String(row.symbol ?? ""), row]),
    );
  }
  if (typeof result === "object") {
    return result as Record<string, unknown>;
  }
  return {};
}

function parseQuote(payload: unknown): LiveFields | null {
  if (!payload || typeof payload !== "object") return null;
  const row = payload as Record<string, unknown>;
  const price = num(row.regularMarketPrice ?? row.currentPrice);
  const changePctRaw = num(row.regularMarketChangePercent);
  const peTtm = positive(num(row.trailingPE));
  const pb = positive(num(row.priceToBook));
  const trailingYield = num(row.trailingAnnualDividendYield);
  const yieldPct = num(row.dividendYield);
  let dividendYield: number | undefined;
  if (trailingYield != null && Math.abs(trailingYield) <= 1) {
    dividendYield = trailingYield;
  } else if (yieldPct != null) {
    dividendYield = yieldPct / 100;
  } else if (trailingYield != null) {
    dividendYield = trailingYield / 100;
  }
  const roe = asRatio(num(row.returnOnEquity), 5);
  if (price == null && changePctRaw == null && peTtm == null && pb == null && dividendYield == null && roe == null) {
    return null;
  }
  return {
    price: price ?? undefined,
    changePct: changePctRaw == null ? undefined : changePctRaw / 100,
    peTtm: peTtm ?? undefined,
    pb: pb ?? undefined,
    dividendYield: dividendYield ?? undefined,
    roe: roe ?? undefined,
    asOf: asOf(row.regularMarketTime),
  };
}

async function fillRoe(
  client: YahooClient,
  quotes: Record<string, LiveFields>,
  oursByYahoo: Map<string, string>,
): Promise<void> {
  const quoteSummary = client.quoteSummary;
  if (!quoteSummary) return;
  const missing = [...oursByYahoo.entries()].filter(([, ours]) => quotes[ours]?.roe == null);
  const settled = await Promise.allSettled(
    missing.map(async ([yahooSymbol, ours]) => {
      const summary = (await quoteSummary(yahooSymbol, {
        modules: ["financialData"],
      })) as { financialData?: { returnOnEquity?: unknown } };
      const roe = asRatio(num(summary?.financialData?.returnOnEquity), 5);
      return { ours, roe };
    }),
  );
  for (const item of settled) {
    if (item.status !== "fulfilled" || item.value.roe == null) continue;
    const current = quotes[item.value.ours] ?? {};
    quotes[item.value.ours] = { ...current, roe: item.value.roe };
  }
}

function matchOurs(yahooSymbol: string, oursByYahoo: Map<string, string>): string | undefined {
  const upper = yahooSymbol.toUpperCase();
  return oursByYahoo.get(upper) ?? oursByYahoo.get(toYahooSymbol(upper));
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function positive(value: number | null): number | null {
  return value != null && value > 0 ? value : null;
}

function asRatio(value: number | null, percentIfGt: number): number | undefined {
  if (value == null) return undefined;
  const ratio = Math.abs(value) > percentIfGt ? value / 100 : value;
  return Number.isFinite(ratio) ? ratio : undefined;
}

function asOf(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 1e12 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return undefined;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("yahoo timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
