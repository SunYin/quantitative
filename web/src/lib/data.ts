import snapshotJson from "@/data/snapshot.json";

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
  pe_ttm: number | null;
  pb: number | null;
  fcf_yield: number | null;
  dividend_yield: number;
  composite: number;
  quality: ScoreBlock;
  valuation: ScoreBlock;
  position_cap: number;
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

export type Industry = {
  name: string;
  name_en: string;
  markets: string[];
  cycle_position: string;
  notes: string;
  leaders: string[];
  score: ScoreBlock;
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
  briefs: StockBrief[];
  strategies: Strategy[];
  industries: Industry[];
  reports: Report[];
  markets: MarketProfile[];
  connect: Record<string, string>;
  checklist: string[];
};

export const snapshot = snapshotJson as Snapshot;

export function listStocks(): StockBrief[] {
  return [...snapshot.briefs].sort((a, b) => b.composite - a.composite);
}

export function getStock(symbol: string): StockBrief | undefined {
  const key = decodeURIComponent(symbol).toUpperCase();
  return snapshot.briefs.find((item) => item.symbol.toUpperCase() === key);
}

export function listIndustries(): Industry[] {
  return [...snapshot.industries].sort((a, b) => b.score.total - a.score.total);
}

export function getIndustry(name: string): Industry | undefined {
  const key = decodeURIComponent(name);
  return snapshot.industries.find(
    (item) => item.name === key || item.name_en.toLowerCase() === key.toLowerCase(),
  );
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
