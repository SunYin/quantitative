"""Shared scoring helpers."""

from __future__ import annotations

from quant.models import ScoreBreakdown


def clip(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def scale(value: float, low: float, high: float, invert: bool = False) -> float:
    """Map value in [low, high] onto 0-100. Outside range is clipped."""
    if high == low:
        return 50.0
    ratio = (value - low) / (high - low)
    score = ratio * 100.0
    if invert:
        score = 100.0 - score
    return clip(score)


def grade(score: float) -> str:
    if score >= 85:
        return "A"
    if score >= 75:
        return "B+"
    if score >= 65:
        return "B"
    if score >= 55:
        return "C+"
    if score >= 45:
        return "C"
    if score >= 35:
        return "D"
    return "F"


def breakdown(factors) -> ScoreBreakdown:
    total = sum(f.contribution for f in factors)
    flags: list[str] = []
    for factor in factors:
        if factor.score < 35:
            flags.append(f"{factor.name} 偏弱")
    return ScoreBreakdown(total=round(total, 2), grade=grade(total), factors=list(factors), flags=flags)
