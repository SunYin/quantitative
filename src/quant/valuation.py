"""Relative valuation with sector- and market-aware primary metrics."""

from __future__ import annotations

from quant.models import FactorScore, Market, ScoreBreakdown, SectorStyle, Stock
from quant.scoring import breakdown, clip, scale

# Illustrative peer medians for the sample universe. Replace with live peers in production.
PEER_PE = {
    "白酒": 22.0,
    "电池": 18.0,
    "银行": 6.5,
    "保险": 9.0,
    "互联网平台": 18.0,
    "本地生活": 22.0,
    "半导体": 35.0,
    "云计算": 32.0,
    "晶圆代工": 22.0,
    "新能源车": 20.0,
    "消费电子": 28.0,
    "创新药": 30.0,
    "石油": 12.0,
    "光伏": 16.0,
    "公用事业": 18.0,
    "交易所": 26.0,
}
PEER_PB = {
    "银行": 0.65,
    "保险": 0.90,
    "交易所": 7.0,
}
US_PEER_PB = {
    "银行": 1.40,
}
PEER_EV_EBITDA = {
    "电池": 12.0,
    "半导体": 22.0,
    "消费电子": 18.0,
    "本地生活": 14.0,
    "互联网平台": 12.0,
    "云计算": 20.0,
    "晶圆代工": 16.0,
    "新能源车": 13.0,
    "光伏": 8.0,
    "石油": 6.0,
    "公用事业": 11.0,
    "交易所": 18.0,
}


def score_valuation(stock: Stock) -> ScoreBreakdown:
    factors = [
        _primary_multiple(stock),
        _cash_yield(stock),
        _growth_adjusted(stock),
        _market_context(stock),
    ]
    result = breakdown(factors)
    if stock.pe_ttm is not None and stock.pe_ttm < 0:
        result.flags.append("亏损，PE 无意义，应改用 P/S 或 EV/Sales")
    return result


def implied_upside(stock: Stock) -> float | None:
    """Very rough multiple-reversion upside vs peer median. Not a target price."""
    if stock.pe_ttm and stock.pe_ttm > 0 and stock.industry in PEER_PE:
        return PEER_PE[stock.industry] / stock.pe_ttm - 1.0
    if stock.pb and stock.pb > 0 and stock.industry in PEER_PB:
        return PEER_PB[stock.industry] / stock.pb - 1.0
    return None


def _primary_multiple(stock: Stock) -> FactorScore:
    if stock.style == SectorStyle.FINANCIAL and stock.pb:
        if stock.market == Market.US:
            peer = US_PEER_PB.get(stock.industry, 1.4)
        else:
            peer = PEER_PB.get(stock.industry, 0.8)
        score = scale(stock.pb / peer, 0.55, 1.8, invert=True)
        rationale = f"PB {stock.pb:.2f} vs {stock.market.value} 同行中位 {peer:.2f}"
        inputs = {"pb": stock.pb, "peer_pb": peer}
    elif stock.pe_ttm and stock.pe_ttm > 0:
        peer = PEER_PE.get(stock.industry, 18.0)
        score = scale(stock.pe_ttm / peer, 0.55, 1.9, invert=True)
        rationale = f"PE {stock.pe_ttm:.1f}x vs 行业中位 {peer:.1f}x"
        inputs = {"pe": stock.pe_ttm, "peer_pe": peer}
    else:
        score, rationale, inputs = 40.0, "缺少有效 PE/PB，估值打分保守", {}
    return FactorScore(name="相对估值", score=score, weight=0.35, rationale=rationale, inputs=inputs)


def _cash_yield(stock: Stock) -> FactorScore:
    if stock.fcf_yield is None:
        score, rationale = 50.0, "无 FCF 收益率，中性处理"
    else:
        score = scale(stock.fcf_yield, 0.01, 0.09)
        rationale = f"FCF yield {stock.fcf_yield:.1%}"
    if stock.ev_ebitda and stock.industry in PEER_EV_EBITDA:
        peer = PEER_EV_EBITDA[stock.industry]
        ev_s = scale(stock.ev_ebitda / peer, 0.6, 1.8, invert=True)
        score = 0.6 * score + 0.4 * ev_s
        rationale += f"；EV/EBITDA {stock.ev_ebitda:.1f}x vs {peer:.1f}x"
    return FactorScore(
        name="现金流估值",
        score=clip(score),
        weight=0.25,
        rationale=rationale,
        inputs={"fcf_yield": stock.fcf_yield or 0.0, "ev_ebitda": stock.ev_ebitda or 0.0},
    )


def _growth_adjusted(stock: Stock) -> FactorScore:
    growth = max(stock.financials.eps_cagr_3y, stock.financials.revenue_cagr_3y, 0.01)
    if stock.pe_ttm and stock.pe_ttm > 0:
        peg = stock.pe_ttm / (growth * 100.0)
        score = scale(peg, 0.6, 2.8, invert=True)
        rationale = f"PEG {peg:.2f}（PE / {growth:.1%} 增长）"
        inputs = {"peg": peg, "growth": growth}
    else:
        score = scale(growth, 0.0, 0.25)
        rationale = f"无 PE，用增长 {growth:.1%} 近似"
        inputs = {"growth": growth}
    return FactorScore(name="增长调整估值", score=score, weight=0.20, rationale=rationale, inputs=inputs)


def _market_context(stock: Stock) -> FactorScore:
    """A shares often pay a policy/liquidity premium; H often has a governance discount."""
    score = 60.0
    note = []
    if stock.market == Market.A_SHARE:
        score -= 6.0
        note.append("A 股流动性溢价，同样基本面通常更贵")
    elif stock.market == Market.HK:
        score += 6.0
        note.append("港股机构折价常见，安全边际相对更好")
        if stock.southbound_eligible:
            score += 3.0
            note.append("港股通标的有内地增量资金")
    elif stock.market == Market.US:
        score += 2.0
        note.append("美股信息披露完整，折现率随美债波动")
    if stock.dividend_yield >= 0.04:
        score += 5.0
        note.append(f"股息率 {stock.dividend_yield:.1%}")
    return FactorScore(
        name="市场折溢价",
        score=clip(score),
        weight=0.20,
        rationale="；".join(note) if note else "中性",
        inputs={"dividend_yield": stock.dividend_yield},
    )
