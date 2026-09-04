"""Exchange microstructure, listing rules, and Stock Connect mechanics."""

from __future__ import annotations

from dataclasses import dataclass

from quant.models import Market, Stock


@dataclass(frozen=True)
class MarketProfile:
    market: Market
    currency: str
    settlement: str
    price_limit: str
    lot_convention: str
    shorting: str
    primary_research: str
    key_flows: str
    valuation_habit: str
    governance_focus: tuple[str, ...]
    industry_taxonomy: str


PROFILES: dict[Market, MarketProfile] = {
    Market.A_SHARE: MarketProfile(
        market=Market.A_SHARE,
        currency="CNY",
        settlement="T+1 (cash T+0 restricted)",
        price_limit="±10% main board / ±20% ChiNext & STAR (normal days)",
        lot_convention="100-share board lot; no odd-lot trading for most retail",
        shorting="Limited; refinancing and designated shorts only",
        primary_research="Broker notes, 交易所公告, 北向持股, 申万/中信行业",
        key_flows="北向资金, 融资融券, 公募抱团, 产业资本增减持",
        valuation_habit="PE/PEG for growth; PB for banks; 政策溢价常见",
        governance_focus=(
            "应收账款与商誉",
            "大股东质押与减持",
            "关联交易与资金占用",
            "审计意见与财务真实性",
        ),
        industry_taxonomy="申万 / 中信",
    ),
    Market.HK: MarketProfile(
        market=Market.HK,
        currency="HKD",
        settlement="T+2",
        price_limit="None (wide gap risk)",
        lot_convention="Issuer-defined board lot",
        shorting="Active; designated list, stamp duty on both sides",
        primary_research="Sell-side EN/CN, southbound holdings, HKEX filings",
        key_flows="南向港股通, 海外主动资金, 指数再平衡",
        valuation_habit="H often cheaper than A; P/S for internet; P/EV for insurers",
        governance_focus=(
            "老千股与频繁供股",
            "不同投票权 / WVR",
            "关联交易与私有化折价",
            "审计更换与财报延迟",
        ),
        industry_taxonomy="Hang Seng Industry / GICS overlay",
    ),
    Market.US: MarketProfile(
        market=Market.US,
        currency="USD",
        settlement="T+1",
        price_limit="None; LULD trading pauses",
        lot_convention="1 share",
        shorting="Deep locate market; 13F / FINRA short interest",
        primary_research="10-K/10-Q/8-K, earnings calls, 13F, sell-side",
        key_flows="ETF/被动, 回购, 利率敏感板块轮动",
        valuation_habit="FCF yield / EV-EBITDA core; PEG and rule-of-40 for software",
        governance_focus=(
            "稀释与 SBC",
            "关联方与 going-concern",
            "非GAAP 调节质量",
            "董事会独立性与激励",
        ),
        industry_taxonomy="GICS",
    ),
}


CONNECT_RULES = {
    "southbound_name": "港股通 (沪港通/深港通南向)",
    "northbound_name": "沪股通 / 深股通 (北向)",
    "southbound_currency": "CNY converted to HKD under a closed loop",
    "northbound_currency": "HKD/USD converted to CNY under a closed loop",
    "quota_note": "Daily quota can bind on extreme days; stock-level eligibility is a list, not the whole market.",
    "eligibility_southbound": (
        "Hang Seng Composite Large/Mid Cap and selected Small Cap, "
        "plus dual-listed A/H names that meet HKEX & Connect criteria."
    ),
    "eligibility_northbound": (
        "SSE/SZSE names in official Connect lists; ST / risk-alert names are typically excluded."
    ),
    "practical_edge": (
        "Connect does not equal free arb. A and H are different share classes, "
        "with different investor bases, taxes, and borrowing markets."
    ),
}


def profile(market: Market) -> MarketProfile:
    return PROFILES[market]


def connect_status(stock: Stock) -> dict[str, bool | str]:
    return {
        "symbol": stock.symbol,
        "southbound_eligible": stock.southbound_eligible,
        "northbound_eligible": stock.northbound_eligible,
        "has_ah_pair": bool(stock.ah_pair_symbol),
        "ah_pair": stock.ah_pair_symbol or "",
        "implication": _connect_implication(stock),
    }


def _connect_implication(stock: Stock) -> str:
    if stock.market == Market.HK and stock.southbound_eligible:
        return "南向可买：定价同时受海外资金与内地增量资金影响，需跟踪港股通持股变化。"
    if stock.market == Market.A_SHARE and stock.northbound_eligible:
        return "北向可买：海外主动/被动资金会放大风格切换，北向持股是情绪而非基本面本身。"
    if stock.market == Market.HK and not stock.southbound_eligible:
        return "非港股通标的：内地资金无法直接买入，流动性与估值体系更接近海外资金。"
    if stock.market == Market.A_SHARE and not stock.northbound_eligible:
        return "非沪深股通标的：定价更依赖内地资金与政策叙事。"
    return "美股：通过 ADR/普通股交易，与 A/H 价差无直接套利通道。"


def fx_to_hkd(currency: str) -> float:
    """Sample research FX. Replace with a live fix in production."""
    table = {"HKD": 1.0, "CNY": 1.09, "USD": 7.80}
    try:
        return table[currency]
    except KeyError as exc:
        raise ValueError(f"unsupported currency {currency}") from exc
