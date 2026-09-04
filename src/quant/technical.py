"""Lightweight trend/risk overlay. Fundamentals remain the primary engine."""

from __future__ import annotations

from quant.models import FactorScore, ScoreBreakdown, Stock
from quant.scoring import breakdown, clip


def score_technical(stock: Stock) -> ScoreBreakdown:
    """Proxy overlay from beta and style when no price history is supplied."""
    trend = 55.0
    if stock.beta < 0.85:
        trend += 8
        note = "低 beta，回撤通常小于市场"
    elif stock.beta > 1.35:
        trend -= 8
        note = "高 beta，仓位需要更严的回撤约束"
    else:
        note = "beta 接近市场，趋势过滤中性"
    vol_penalty = clip(50 + (1.1 - stock.beta) * 20)
    factors = [
        FactorScore(name="趋势代理", score=clip(trend), weight=0.6, rationale=note, inputs={"beta": stock.beta}),
        FactorScore(
            name="波动约束",
            score=vol_penalty,
            weight=0.4,
            rationale=f"beta={stock.beta:.2f}，用作仓位上限的简化代理",
            inputs={"beta": stock.beta},
        ),
    ]
    return breakdown(factors)


def position_cap(stock: Stock, quality: float, valuation: float) -> float:
    """Suggested max book weight in a diversified book. Not advice."""
    base = 0.08
    if quality >= 75 and valuation >= 65:
        base = 0.12
    elif quality < 50 or valuation < 40:
        base = 0.04
    if stock.beta > 1.4:
        base *= 0.75
    if stock.market_cap < 5e10:
        base *= 0.8
    return round(min(base, 0.15), 3)
