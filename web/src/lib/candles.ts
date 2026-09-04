export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export const CHART_RANGES = ["intraday", "1d", "5d", "1m", "3m", "6m", "1y", "5y"] as const;
export type ChartRange = (typeof CHART_RANGES)[number];

export type ChartStyle = "line" | "candle";
export type ChartInterval = "1m" | "5m" | "15m" | "1d" | "1wk";
export type TimePrecision = "day" | "minute";

export type ChartSpec = {
  interval: ChartInterval;
  lookbackDays: number;
  style: ChartStyle;
  sampleFallback: boolean;
  ttlMs: number;
  minBars: number;
  precision: TimePrecision;
  includePrePost: boolean;
};

export const CHART_SPECS: Record<ChartRange, ChartSpec> = {
  intraday: {
    interval: "1m",
    lookbackDays: 1.4,
    style: "line",
    sampleFallback: false,
    ttlMs: 15_000,
    minBars: 2,
    precision: "minute",
    includePrePost: false,
  },
  "1d": {
    interval: "5m",
    lookbackDays: 1.4,
    style: "candle",
    sampleFallback: false,
    ttlMs: 15_000,
    minBars: 2,
    precision: "minute",
    includePrePost: false,
  },
  "5d": {
    interval: "15m",
    lookbackDays: 8,
    style: "candle",
    sampleFallback: false,
    ttlMs: 30_000,
    minBars: 4,
    precision: "minute",
    includePrePost: false,
  },
  "1m": {
    interval: "1d",
    lookbackDays: 31,
    style: "candle",
    sampleFallback: true,
    ttlMs: 60_000,
    minBars: 8,
    precision: "day",
    includePrePost: false,
  },
  "3m": {
    interval: "1d",
    lookbackDays: 93,
    style: "candle",
    sampleFallback: true,
    ttlMs: 60_000,
    minBars: 8,
    precision: "day",
    includePrePost: false,
  },
  "6m": {
    interval: "1d",
    lookbackDays: 186,
    style: "candle",
    sampleFallback: true,
    ttlMs: 60_000,
    minBars: 8,
    precision: "day",
    includePrePost: false,
  },
  "1y": {
    interval: "1d",
    lookbackDays: 370,
    style: "candle",
    sampleFallback: true,
    ttlMs: 60_000,
    minBars: 8,
    precision: "day",
    includePrePost: false,
  },
  "5y": {
    interval: "1wk",
    lookbackDays: 365 * 5 + 7,
    style: "candle",
    sampleFallback: true,
    ttlMs: 60_000,
    minBars: 8,
    precision: "day",
    includePrePost: false,
  },
};

export const RANGE_DAYS: Record<ChartRange, number> = {
  intraday: CHART_SPECS.intraday.lookbackDays,
  "1d": CHART_SPECS["1d"].lookbackDays,
  "5d": CHART_SPECS["5d"].lookbackDays,
  "1m": CHART_SPECS["1m"].lookbackDays,
  "3m": CHART_SPECS["3m"].lookbackDays,
  "6m": CHART_SPECS["6m"].lookbackDays,
  "1y": CHART_SPECS["1y"].lookbackDays,
  "5y": CHART_SPECS["5y"].lookbackDays,
};

export function isChartRange(value: string): value is ChartRange {
  return (CHART_RANGES as readonly string[]).includes(value);
}

export function isLiveRange(range: ChartRange): boolean {
  return !CHART_SPECS[range].sampleFallback;
}

export type ChartPayload = {
  symbol: string;
  market: string;
  currency: string;
  range: ChartRange;
  style: ChartStyle;
  interval: ChartInterval;
  source: "yahoo" | "sample";
  candles: Candle[];
  previousClose: number | null;
  lastPrice: number | null;
  changePct: number | null;
  asOf: string | null;
};

type YahooQuote = {
  date?: Date | string;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
};

export function parseYahooQuotes(quotes: YahooQuote[], precision: TimePrecision = "day"): Candle[] {
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
      time: formatCandleTime(date, precision),
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
      volume: Math.max(0, finite(row.volume) ?? 0),
    });
  }
  return out;
}

export function formatCandleTime(date: Date, precision: TimePrecision): string {
  if (precision === "day") return date.toISOString().slice(0, 10);
  return date.toISOString().replace(".000Z", "Z");
}

export type ChartSpan = {
  first: string;
  last: string;
  days: number;
  years: number;
};

export function chartSpan(candles: Candle[]): ChartSpan | null {
  if (candles.length < 2) return null;
  const first = candles[0].time.slice(0, 10);
  const last = candles[candles.length - 1].time.slice(0, 10);
  const start = Date.parse(`${first}T00:00:00Z`);
  const end = Date.parse(`${last}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const days = (end - start) / 86_400_000;
  return { first, last, days, years: days / 365.25 };
}

/** 5Y is short when Yahoo (or listing age) covers less than about 4 years. */
export function isShortHistory(range: ChartRange, span: ChartSpan | null): boolean {
  if (!span || range !== "5y") return false;
  return span.years < 4;
}

export function sampleStepDays(range: ChartRange): number {
  return CHART_SPECS[range].interval === "1wk" ? 7 : 1;
}

export function sampleCandles(
  symbol: string,
  last: number,
  days: number,
  opts: { end?: Date; stepDays?: number } = {},
): Candle[] {
  const stepDays = Math.max(1, opts.stepDays ?? 1);
  const bars =
    stepDays >= 7 ? Math.max(20, Math.round(days / stepDays)) : Math.max(20, Math.round((days * 5) / 7));
  const rng = mulberry(hash32(symbol));
  const spot = Math.max(0.01, last);
  const closes: number[] = new Array(bars);
  let px = spot;
  for (let i = bars - 1; i >= 0; i--) {
    closes[i] = px;
    const ret = (rng() - 0.48) * 0.03;
    px = Math.max(spot * 0.4, px / (1 + ret));
  }
  const end = opts.end ?? new Date();
  const endMs = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const built: Candle[] = [];
  let cursor = 0;
  let i = bars - 1;
  while (i >= 0) {
    const day = new Date(endMs - cursor * 86_400_000);
    cursor += 1;
    const wd = day.getUTCDay();
    if (stepDays < 7 && (wd === 0 || wd === 6)) continue;
    const close = closes[i];
    const open = close * (1 + (rng() - 0.5) * 0.012);
    const high = Math.max(open, close) * (1 + rng() * 0.01);
    const low = Math.min(open, close) * (1 - rng() * 0.01);
    built.push({
      time: day.toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
      volume: Math.round(5e5 + rng() * 4e6),
    });
    i -= 1;
    if (stepDays >= 7) cursor += stepDays - 1;
  }
  return built.reverse();
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
