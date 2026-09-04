"""Typed domain objects shared across markets and strategies."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Literal


class Market(str, Enum):
    A_SHARE = "A"
    HK = "HK"
    US = "US"


ListingBoard = Literal[
    "SSE",
    "SZSE",
    "BSE",
    "HKEX",
    "NYSE",
    "NASDAQ",
    "AMEX",
]


class SectorStyle(str, Enum):
    CONSUMER = "consumer"
    FINANCIAL = "financial"
    INTERNET = "internet"
    INDUSTRIAL = "industrial"
    HEALTHCARE = "healthcare"
    ENERGY = "energy"
    TECH_HARDWARE = "tech_hardware"
    REAL_ESTATE = "real_estate"
    UTILITY = "utility"
    MATERIALS = "materials"


@dataclass(frozen=True)
class Financials:
    """Latest-year / TTM snapshot. Ratios are decimals (0.18 = 18%)."""

    revenue: float
    net_income: float
    operating_cash_flow: float
    free_cash_flow: float
    total_equity: float
    total_debt: float
    cash: float
    ebit: float
    ebitda: float
    interest_expense: float
    current_assets: float
    current_liabilities: float
    revenue_cagr_3y: float
    eps_cagr_3y: float
    roe: float
    roic: float
    gross_margin: float
    net_margin: float
    earnings_volatility: float
    shares_dilution_3y: float = 0.0
    related_party_ratio: float = 0.0
    receivable_days: float = 45.0
    inventory_days: float = 60.0
    npl_ratio: float | None = None
    core_tier1: float | None = None


@dataclass(frozen=True)
class Stock:
    symbol: str
    name: str
    name_en: str
    market: Market
    board: ListingBoard
    sector: str
    industry: str
    style: SectorStyle
    currency: str
    price: float
    shares_out: float
    pe_ttm: float | None
    pb: float | None
    ev_ebitda: float | None
    fcf_yield: float | None
    dividend_yield: float
    beta: float
    southbound_eligible: bool
    northbound_eligible: bool
    dual_class: bool
    financials: Financials
    ah_pair_symbol: str | None = None
    gics_industry: str = ""
    shenwan_industry: str = ""
    notes: str = ""

    @property
    def market_cap(self) -> float:
        return self.price * self.shares_out

    @property
    def net_debt(self) -> float:
        return self.financials.total_debt - self.financials.cash


@dataclass(frozen=True)
class IndustrySnapshot:
    name: str
    name_en: str
    markets: tuple[Market, ...]
    growth_3y: float
    expected_growth_2y: float
    cr5: float
    hhi: float
    median_roe: float
    median_roic: float
    policy_score: float
    disruption_risk: float
    valuation_percentile: float
    profit_pool_trend: float
    cycle_position: Literal["early", "mid", "late", "trough"]
    notes: str = ""
    leaders: tuple[str, ...] = ()
    aliases: tuple[str, ...] = ()
    constituents: tuple[str, ...] = ()


ChainRole = Literal["upstream", "midstream", "downstream"]


@dataclass(frozen=True)
class ChainNode:
    """One layer on a value chain. `industry` is an IndustrySnapshot name."""

    role: ChainRole
    industry: str
    captures: str
    bottleneck: bool = False


@dataclass(frozen=True)
class ValueChain:
    """Cross-industry map: who captures profit, who is a bottleneck."""

    id: str
    name: str
    name_en: str
    aliases: tuple[str, ...]
    thesis: str
    notes: str
    nodes: tuple[ChainNode, ...]


IPOStatus = Literal["hearing", "filed", "passed", "subscribed", "priced", "listed", "postponed"]


@dataclass(frozen=True)
class IPODeal:
    """Sample IPO / new-listing pipeline. Not an exchange official calendar."""

    id: str
    name: str
    name_en: str
    market: Market
    board: str
    industry: str
    status: IPOStatus
    expected_date: str
    currency: str
    proceeds: float | None
    sponsor: str
    notes: str
    comparables: tuple[str, ...] = ()
    chain_id: str | None = None
    listed_symbol: str | None = None


@dataclass(frozen=True)
class ResearchReport:
    title: str
    broker: str
    language: Literal["zh", "en"]
    symbol: str
    rating: Literal["buy", "overweight", "hold", "underweight", "sell", "unrated"]
    target_price: float | None
    current_price: float | None
    published: str
    body: str
    has_initiation: bool = False
    broker_is_underwriter: bool = False
    has_quant_model: bool = False


@dataclass
class FactorScore:
    name: str
    score: float
    weight: float
    rationale: str
    inputs: dict[str, float | str] = field(default_factory=dict)

    @property
    def contribution(self) -> float:
        return self.score * self.weight


@dataclass
class ScoreBreakdown:
    total: float
    grade: str
    factors: list[FactorScore]
    flags: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "total": round(self.total, 1),
            "grade": self.grade,
            "factors": [
                {
                    "name": f.name,
                    "score": round(f.score, 1),
                    "weight": f.weight,
                    "rationale": f.rationale,
                }
                for f in self.factors
            ],
            "flags": self.flags,
        }
