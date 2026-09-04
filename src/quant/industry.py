"""Top-down industry attractiveness scorecard."""

from __future__ import annotations

from quant.models import FactorScore, IndustrySnapshot, ScoreBreakdown
from quant.scoring import breakdown, clip, scale

CYCLE_SCORE = {"early": 82.0, "mid": 68.0, "late": 42.0, "trough": 70.0}


def score_industry(industry: IndustrySnapshot) -> ScoreBreakdown:
    factors = [
        FactorScore(
            name="需求增长",
            score=0.45 * scale(industry.growth_3y, -0.05, 0.25)
            + 0.55 * scale(industry.expected_growth_2y, -0.04, 0.22),
            weight=0.20,
            rationale=f"过去3年 {industry.growth_3y:.1%}，未来2年预期 {industry.expected_growth_2y:.1%}",
            inputs={"growth_3y": industry.growth_3y, "expected_growth_2y": industry.expected_growth_2y},
        ),
        FactorScore(
            name="竞争结构",
            score=0.55 * scale(industry.cr5, 0.25, 0.80) + 0.45 * scale(industry.hhi, 600, 2200),
            weight=0.18,
            rationale=f"CR5 {industry.cr5:.0%}，HHI {industry.hhi:.0f}（越高越集中）",
            inputs={"cr5": industry.cr5, "hhi": industry.hhi},
        ),
        FactorScore(
            name="利润池",
            score=0.5 * scale(industry.median_roe, 0.05, 0.22)
            + 0.3 * scale(industry.median_roic, 0.04, 0.18)
            + 0.2 * scale(industry.profit_pool_trend, -0.1, 0.12),
            weight=0.18,
            rationale=(
                f"行业ROE中位 {industry.median_roe:.1%}，ROIC {industry.median_roic:.1%}，"
                f"利润池趋势 {industry.profit_pool_trend:+.1%}"
            ),
            inputs={
                "median_roe": industry.median_roe,
                "median_roic": industry.median_roic,
                "profit_pool_trend": industry.profit_pool_trend,
            },
        ),
        FactorScore(
            name="政策与监管",
            score=scale(industry.policy_score, 20, 90),
            weight=0.16,
            rationale=f"政策友好度 {industry.policy_score:.0f}/100（A/港股对政策更敏感）",
            inputs={"policy_score": industry.policy_score},
        ),
        FactorScore(
            name="估值周期",
            score=scale(industry.valuation_percentile, 15, 85, invert=True),
            weight=0.14,
            rationale=f"估值分位 {industry.valuation_percentile:.0f}（越高越贵）",
            inputs={"valuation_percentile": industry.valuation_percentile},
        ),
        FactorScore(
            name="颠覆与周期位置",
            score=clip(0.55 * scale(industry.disruption_risk, 15, 85, invert=True) + 0.45 * CYCLE_SCORE[industry.cycle_position]),
            weight=0.14,
            rationale=f"颠覆风险 {industry.disruption_risk:.0f}，周期 {industry.cycle_position}",
            inputs={"disruption_risk": industry.disruption_risk},
        ),
    ]
    result = breakdown(factors)
    if industry.valuation_percentile >= 80:
        result.flags.append("行业估值处于高分位，即使景气好也要降预期回报")
    if industry.disruption_risk >= 70:
        result.flags.append("技术或模式颠覆风险高，避免用历史 PE 外推")
    if industry.policy_score <= 35:
        result.flags.append("监管或产业政策偏逆风")
    return result


def industry_memo(industry: IndustrySnapshot, score: ScoreBreakdown) -> str:
    leaders = "、".join(industry.leaders) if industry.leaders else "（样本未指定龙头）"
    markets = "/".join(m.value for m in industry.markets)
    return (
        f"# {industry.name} / {industry.name_en}\n\n"
        f"- 覆盖市场：{markets}\n"
        f"- 吸引力评分：**{score.total:.1f} ({score.grade})**\n"
        f"- 周期位置：{industry.cycle_position}\n"
        f"- 观察龙头：{leaders}\n"
        f"- 备注：{industry.notes or '无'}\n"
    )
