import snapshotJson from "@/data/snapshot.json";
import { findSampleTicker, suggestTickers, type TickerHit } from "@/lib/ticker";

export type Factor = {
  name: string;
  score: number;
  weight: number;
  rationale: string;
};

export type ScoreBlock = {
  total: number;
  grade: string;
  flags: string[];
  factors: Factor[];
};

export type LiveSource = "yahoo" | "sample";

export type QuoteMeta = {
  source: "yahoo" | "sample" | "mixed";
  as_of: string | null;
  fields: {
    price: LiveSource;
    change_pct: LiveSource;
    pe_ttm: LiveSource;
    pb: LiveSource;
    dividend_yield: LiveSource;
    roe: LiveSource;
  };
};

export type LiveSummary = {
  quotes: "yahoo" | "sample" | "mixed";
  scores: "sample" | "live-rescored";
  fetched_at: string | null;
  applied: number;
  failed: number;
};

export type StockBrief = {
  symbol: string;
  name: string;
  name_en: string;
  market: string;
  board: string;
  sector: string;
  industry: string;
  currency: string;
  southbound_eligible: boolean;
  northbound_eligible: boolean;
  ah_pair_symbol: string | null;
  notes: string;
  price: number;
  change_pct: number | null;
  pe_ttm: number | null;
  pb: number | null;
  fcf_yield: number | null;
  dividend_yield: number;
  roe: number | null;
  composite: number;
  quality: ScoreBlock;
  valuation: ScoreBlock;
  position_cap: number;
  quote: QuoteMeta;
  connect: {
    symbol: string;
    southbound_eligible: boolean;
    northbound_eligible: boolean;
    has_ah_pair: boolean;
    ah_pair: string;
    implication: string;
  };
};

export type StrategyRow = {
  symbol: string;
  name: string;
  market: string;
  score: number;
  action: string;
  reason: string;
  extras: Record<string, string | number | boolean>;
};

export type Strategy = {
  id: string;
  name: string;
  objective: string;
  notes: string[];
  rows: StrategyRow[];
};

export type Constituent = {
  symbol: string;
  name: string;
  name_en: string;
  market: string;
};

export type Industry = {
  name: string;
  name_en: string;
  markets: string[];
  cycle_position: string;
  notes: string;
  leaders: string[];
  aliases?: string[];
  constituents: Constituent[];
  score: ScoreBlock;
};

export type ChainLayer = {
  role: string;
  role_zh: string;
  industry: string;
  industry_en: string;
  captures: string;
  bottleneck: boolean;
  score: ScoreBlock;
  stocks: Constituent[];
};

export type ValueChain = {
  id: string;
  name: string;
  name_en: string;
  aliases: string[];
  thesis: string;
  notes: string;
    mermaid?: string;
    layers: ChainLayer[];
};

export type Report = {
  id: string;
  title: string;
  broker: string;
  symbol: string;
  rating: string;
  target_price: number | null;
  current_price: number | null;
  published: string;
  body: string;
  score: ScoreBlock;
  claims: {
    thesis_like: string[];
    evidence_like: string[];
    risk_like: string[];
    numbers: string[];
  };
};

export type MarketProfile = {
  market: string;
  currency: string;
  settlement: string;
  price_limit: string;
  lot_convention: string;
  shorting: string;
  primary_research: string;
  key_flows: string;
  valuation_habit: string;
  governance_focus: string[];
  industry_taxonomy: string;
};

export type Snapshot = {
  as_of: string;
  disclaimer: string;
  live?: {
    enabled: boolean;
    source: string;
    applied: number;
    ok: string[];
    failed: string[];
    fetched_at: string | null;
    fallback: boolean;
    rescored: boolean;
  };
  briefs: StockBrief[];
  strategies: Strategy[];
  industries: Industry[];
  chains?: ValueChain[];
  reports: Report[];
  markets: MarketProfile[];
  connect: Record<string, string>;
  checklist: string[];
  coverage?: Coverage;
  ipos?: IPODeal[];
  i18n?: {
    locales: string[];
    default: string;
    phrases: Record<string, string>;
    fragments: { src: string; en: string }[];
    s2hk: Record<string, string>;
  };
};

export type CoverageMarket = {
  market: string;
  sample: number;
  listed_approx: number;
};

export type Coverage = {
  disclaimer: string;
  ipo_disclaimer: string;
  markets: CoverageMarket[];
  sample_total: number;
  listed_approx_total: number;
  industry_count: number;
  ipo_count: number;
};

export type IPODeal = {
  id: string;
  name: string;
  name_en: string;
  market: string;
  board: string;
  industry: string;
  status: string;
  expected_date: string;
  currency: string;
  proceeds: number | null;
  sponsor: string;
  notes: string;
  comparables: string[];
  chain_id: string | null;
  listed_symbol: string | null;
};

export const snapshot = snapshotJson as Snapshot;

const SAMPLE_QUOTE: QuoteMeta = {
  source: "sample",
  as_of: null,
  fields: {
    price: "sample",
    change_pct: "sample",
    pe_ttm: "sample",
    pb: "sample",
    dividend_yield: "sample",
    roe: "sample",
  },
};

function normalizeStock(item: StockBrief): StockBrief {
  return {
    ...item,
    price: item.price ?? 0,
    change_pct: item.change_pct ?? null,
    roe: item.roe ?? null,
    quote: item.quote ?? SAMPLE_QUOTE,
  };
}

export type LiveQuote = {
  symbol: string;
  name: string;
  name_en: string;
  market: string;
  board: string;
  currency: string;
  exchange: string | null;
  price: number | null;
  change_pct: number | null;
  pe_ttm: number | null;
  pb: number | null;
  dividend_yield: number | null;
  as_of: string | null;
};

export type StockLookup =
  | { kind: "sample"; query: string; stock: StockBrief; suggestions: StockBrief[] }
  | { kind: "live"; query: string; quote: LiveQuote; suggestions: StockBrief[] }
  | { kind: "miss"; query: string; suggestions: StockBrief[] };

export function listStocks(): StockBrief[] {
  return snapshot.briefs.map(normalizeStock).sort((a, b) => b.composite - a.composite);
}

export function sampleTickers(): TickerHit[] {
  return snapshot.briefs.map((item) => ({
    symbol: item.symbol,
    name: item.name,
    name_en: item.name_en,
    market: item.market,
  }));
}

export function getStock(symbol: string): StockBrief | undefined {
  const key = decodeURIComponent(symbol).trim();
  const found = findSampleTicker(key, snapshot.briefs);
  return found ? normalizeStock(found) : undefined;
}

export function searchStocks(query: string): StockBrief[] {
  return suggestTickers(query, snapshot.briefs).map(normalizeStock);
}

export function listIndustries(): Industry[] {
  return [...snapshot.industries].map(normalizeIndustry).sort((a, b) => b.score.total - a.score.total);
}

export function getIndustry(name: string): Industry | undefined {
  const key = decodeURIComponent(name).trim();
  const needle = key.toLowerCase().replace(/[\s_-]/g, "");
  return snapshot.industries.map(normalizeIndustry).find((item) => {
    const labels = [item.name, item.name_en, ...(item.aliases ?? [])];
    return labels.some((label) => label.toLowerCase().replace(/[\s_-]/g, "") === needle);
  });
}

export function listChains(): ValueChain[] {
  return [...(snapshot.chains ?? [])];
}

export function getChain(id: string): ValueChain | undefined {
  const key = decodeURIComponent(id).trim();
  const needle = key.toLowerCase().replace(/[\s_-]/g, "");
  return listChains().find((chain) => {
    const labels = [chain.id, chain.name, chain.name_en, ...chain.aliases];
    return labels.some((label) => label.toLowerCase().replace(/[\s_-]/g, "") === needle);
  });
}

function normalizeIndustry(item: Industry): Industry {
  return {
    ...item,
    aliases: item.aliases ?? [],
    constituents: item.constituents ?? [],
  };
}

export function listStrategies(): Strategy[] {
  return snapshot.strategies;
}

export function listReports(): Report[] {
  return snapshot.reports;
}

export function getReport(id: string): Report | undefined {
  return snapshot.reports.find((item) => item.id === id);
}

export function getCoverage(): Coverage | undefined {
  return snapshot.coverage;
}

export function listIpos(): IPODeal[] {
  return [...(snapshot.ipos ?? [])];
}

export function getIpo(id: string): IPODeal | undefined {
  const key = decodeURIComponent(id).trim().toLowerCase().replace(/[\s_-]/g, "");
  return listIpos().find((item) => {
    const labels = [item.id, item.name, item.name_en];
    return labels.some((label) => label.toLowerCase().replace(/[\s_-]/g, "") === key);
  });
}
