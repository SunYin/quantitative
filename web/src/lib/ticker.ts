export type TickerHit = {
  symbol: string;
  name: string;
  name_en: string;
  market: string;
};

export function tickerCandidates(query: string): string[] {
  const raw = query.trim();
  if (!raw) return [];
  const upper = raw.toUpperCase().replaceAll(" ", "");
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (item: string) => {
    if (item && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  };
  add(raw);
  add(upper);

  let hk: string | null = null;
  if (upper.endsWith(".HK")) {
    const digits = upper.slice(0, -3);
    if (/^\d{1,5}$/.test(digits)) hk = digits;
  } else if (/^\d{1,5}$/.test(upper)) {
    hk = upper;
  }
  if (hk) {
    const n = Number.parseInt(hk, 10);
    add(`${n}.HK`);
    add(`${n.toString().padStart(4, "0")}.HK`);
    add(`${n.toString().padStart(5, "0")}.HK`);
  }

  let digits6: string | null = null;
  let suffix: string | null = null;
  if (/^\d{6}$/.test(upper)) {
    digits6 = upper;
  } else {
    const m = upper.match(/^(\d{6})\.(SS|SZ|BJ)$/);
    if (m) {
      digits6 = m[1];
      suffix = m[2];
    }
  }
  if (digits6) {
    if (suffix) add(`${digits6}.${suffix}`);
    else {
      if (/^[659]/.test(digits6)) add(`${digits6}.SS`);
      if (/^[023]/.test(digits6)) add(`${digits6}.SZ`);
      if (/^[48]/.test(digits6)) add(`${digits6}.BJ`);
      add(`${digits6}.SS`);
      add(`${digits6}.SZ`);
    }
  }
  return out;
}

export function normLabel(text: string): string {
  return text.trim().toLowerCase().replace(/[\s._-]/g, "");
}

export function findSampleTicker<T extends TickerHit>(query: string, stocks: T[]): T | undefined {
  const cands = new Set(tickerCandidates(query).map((item) => item.toUpperCase()));
  for (const stock of stocks) {
    if (cands.has(stock.symbol.toUpperCase())) return stock;
  }
  const needle = normLabel(query);
  if (needle.length < 1) return undefined;
  const exact = stocks.find(
    (stock) =>
      normLabel(stock.name) === needle ||
      normLabel(stock.name_en) === needle ||
      normLabel(stock.symbol) === needle,
  );
  if (exact) return exact;
  if (needle.length < 2) return undefined;
  const partial = stocks.filter(
    (stock) =>
      normLabel(stock.name).includes(needle) ||
      normLabel(stock.name_en).includes(needle) ||
      stock.symbol.toUpperCase().includes(query.trim().toUpperCase()),
  );
  return partial.length === 1 ? partial[0] : undefined;
}

export function suggestTickers<T extends TickerHit>(query: string, stocks: T[], limit = 8): T[] {
  const needle = normLabel(query);
  if (!needle) return [];
  const scored = stocks
    .map((stock) => {
      const symbol = stock.symbol.toUpperCase();
      const name = normLabel(stock.name);
      const en = normLabel(stock.name_en);
      let score = 0;
      if (tickerCandidates(query).some((item) => item.toUpperCase() === symbol)) score = 100;
      else if (name === needle || en === needle) score = 90;
      else if (symbol.startsWith(query.trim().toUpperCase())) score = 80;
      else if (name.startsWith(needle) || en.startsWith(needle)) score = 70;
      else if (name.includes(needle) || en.includes(needle) || symbol.includes(query.trim().toUpperCase())) score = 40;
      return { stock, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((row) => row.stock);
}

export function guessListing(symbol: string, exchange?: string | null): { market: string; board: string } {
  const u = symbol.toUpperCase();
  const ex = (exchange ?? "").toUpperCase();
  if (u.endsWith(".SS") || ex === "SHH" || ex.includes("SHANGHAI")) return { market: "A", board: "SSE" };
  if (u.endsWith(".SZ") || ex === "SHZ" || ex.includes("SHENZHEN")) return { market: "A", board: "SZSE" };
  if (u.endsWith(".BJ") || ex.includes("BEIJING")) return { market: "A", board: "BSE" };
  if (u.endsWith(".HK") || ex === "HKG" || ex.includes("HONG KONG")) return { market: "HK", board: "HKEX" };
  if (ex === "NMS" || ex === "NAS" || ex.includes("NASDAQ")) return { market: "US", board: "NASDAQ" };
  if (ex === "NYQ" || ex.includes("NYSE")) return { market: "US", board: "NYSE" };
  return { market: "US", board: "NYSE" };
}

export function guessCurrency(symbol: string, market?: string): string {
  const u = symbol.toUpperCase();
  if (u.endsWith(".SS") || u.endsWith(".SZ") || u.endsWith(".BJ") || market === "A") return "CNY";
  if (u.endsWith(".HK") || market === "HK") return "HKD";
  return "USD";
}
