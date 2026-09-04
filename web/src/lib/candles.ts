export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type ChartRange = "1m" | "3m" | "6m" | "1y";

export const RANGE_DAYS: Record<ChartRange, number> = {
  "1m": 31,
  "3m": 93,
  "6m": 186,
  "1y": 370,
};

export function isChartRange(value: string): value is ChartRange {
  return value === "1m" || value === "3m" || value === "6m" || value === "1y";
}

export type ChartPayload = {
  symbol: string;
  market: string;
  currency: string;
  range: ChartRange;
  source: "yahoo" | "sample";
  candles: Candle[];
};

type YahooQuote = {
  date?: Date | string;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
};

export function parseYahooQuotes(quotes: YahooQuote[]): Candle[] {
  const out: Candle[] = [];
  for (const row of quotes) {
    const close = finite(row.close);
    const open = finite(row.open) ?? close;
    if (close == null || open == null) continue;
    const high = finite(row.high) ?? Math.max(open, close);
    const low = finite(row.low) ?? Math.min(open, close);
    const date = toDate(row.date);
    if (!date) continue;
    out.push({
      time: date.toISOString().slice(0, 10),
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
      volume: Math.max(0, finite(row.volume) ?? 0),
    });
  }
  return out;
}

export function sampleCandles(symbol: string, last: number, days: number): Candle[] {
  const bars = Math.max(20, Math.round((days * 5) / 7));
  const rng = mulberry(hash32(symbol));
  const spot = Math.max(0.01, last);
  const closes: number[] = new Array(bars);
  let px = spot;
  for (let i = bars - 1; i >= 0; i--) {
    closes[i] = px;
    const ret = (rng() - 0.48) * 0.03;
    px = Math.max(spot * 0.4, px / (1 + ret));
  }
  const start = Date.UTC(2026, 0, 2);
  const candles: Candle[] = [];
  let cursor = 0;
  let i = 0;
  while (candles.length < bars) {
    const day = new Date(start + cursor * 86400000);
    cursor += 1;
    const wd = day.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    const close = closes[i];
    const open = close * (1 + (rng() - 0.5) * 0.012);
    const high = Math.max(open, close) * (1 + rng() * 0.01);
    const low = Math.min(open, close) * (1 - rng() * 0.01);
    candles.push({
      time: day.toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
      volume: Math.round(5e5 + rng() * 4e6),
    });
    i += 1;
  }
  return candles;
}

export function movingAverage(candles: Candle[], window: number): Array<number | null> {
  return candles.map((_, index) => {
    if (index + 1 < window) return null;
    let sum = 0;
    for (let j = index + 1 - window; j <= index; j++) sum += candles[j].close;
    return sum / window;
  });
}

function finite(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 1e12 ? value : value * 1000;
    const parsed = new Date(ms);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function hash32(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry(seed: number): () => number {
  let t = seed || 1;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
