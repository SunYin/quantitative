"""Sell-side / industry report reading checklist and heuristic scorer."""

from __future__ import annotations

import re

from quant.models import FactorScore, ResearchReport, ScoreBreakdown
from quant.scoring import breakdown, clip

THESIS_HINTS = (
    "核心结论",
    "投资逻辑",
    "thesis",
    "we believe",
    "我们认为",
    "关键假设",
    "关键变化",
)
EVIDENCE_HINTS = (
    "草根",
    "渠道调研",
    "channel check",
    "毛利率",
    "万吨",
    "产能",
    "市占",
    "asp",
    "同店",
    "same-store",
    "10-k",
    "招股",
    "公告",
    "财报",
)
VALUATION_HINTS = (
    "dcf",
    "pe",
    "pb",
    "ev/ebitda",
    "fcf",
    "目标价",
    "target price",
    "敏感性",
    "sensitivity",
    "wacc",
)
RISK_HINTS = (
    "风险",
    "risk",
    "下行",
    "bear",
    "如果不及预期",
    "监管",
    "竞争加剧",
)
RED_FLAGS = (
    "必涨",
    "稳赚",
    "无风险",
    "只涨不跌",
    "空间巨大且确定",
    "不存在风险",
)
BOILERPLATE_RISK = (
    "宏观经济波动",
    "市场波动风险",
    "general market risk",
)


def score_research(report: ResearchReport) -> ScoreBreakdown:
    text = report.body.lower()
    factors = [
        _thesis(report, text),
        _evidence(report, text),
        _valuation_rigor(report, text),
        _risks(report, text),
        _independence(report),
        _price_discipline(report),
    ]
    result = breakdown(factors)
    for flag in RED_FLAGS:
        if flag in report.body:
            result.flags.append(f"营销话术：{flag}")
    if report.has_initiation and report.rating in {"buy", "overweight"}:
        result.flags.append("首次覆盖且给买入：检查是否在帮投行客户做市值管理")
    if report.broker_is_underwriter:
        result.flags.append("报告机构同时是承销商/财务顾问，独立性打折")
    return result


def extract_claims(report: ResearchReport) -> dict[str, list[str]]:
    sentences = _sentences(report.body)
    return {
        "thesis_like": [s for s in sentences if _has_any(s.lower(), THESIS_HINTS)][:5],
        "evidence_like": [s for s in sentences if _has_any(s.lower(), EVIDENCE_HINTS)][:8],
        "risk_like": [s for s in sentences if _has_any(s.lower(), RISK_HINTS)][:8],
        "numbers": _numbers(report.body),
    }


def reading_checklist() -> list[str]:
    return [
        "用两句话复述卖方结论，复述不出来就先不要看目标价。",
        "找出 1-2 个可证伪的关键假设（量、价、费率、市占、利率）。",
        "核对估值方法是否匹配行业：银行看 PB/ROTE，互联网看 P/S 与 FCF，周期看中周期 EV/EBITDA。",
        "把目标价还原成隐含倍数，再和十年分位比较。",
        "风险章节是真实情景还是模板？有没有量化下行。",
        "作者近期是否连续上调/下调，以及是否同时覆盖产业链上下游。",
        "港股通/北向标的要额外看资金持仓变化，而不是把资金当基本面。",
        "A/H 同时覆盖时，两地目标价差应能被汇率、流动性、股东结构解释。",
        "美股报告优先对 10-K 风险因素和电话会问答，而不是摘要页。",
        "把报告当成假设生成器，而不是结论外包。",
    ]


def _thesis(report: ResearchReport, text: str) -> FactorScore:
    hits = sum(1 for k in THESIS_HINTS if k in text)
    length_bonus = 8 if 400 <= len(report.body) <= 12000 else 0
    score = clip(35 + hits * 12 + length_bonus)
    return FactorScore(
        name="投资逻辑清晰度",
        score=score,
        weight=0.20,
        rationale=f"逻辑关键词 {hits} 处，正文 {len(report.body)} 字",
    )


def _evidence(report: ResearchReport, text: str) -> FactorScore:
    hits = sum(1 for k in EVIDENCE_HINTS if k in text)
    numbers = len(_numbers(report.body))
    score = clip(30 + hits * 8 + min(numbers, 12) * 2)
    if report.has_quant_model:
        score = clip(score + 8)
    return FactorScore(
        name="证据质量",
        score=score,
        weight=0.20,
        rationale=f"一手/数据线索 {hits}，抽取数字 {min(numbers, 12)} 个",
    )


def _valuation_rigor(report: ResearchReport, text: str) -> FactorScore:
    hits = sum(1 for k in VALUATION_HINTS if k in text)
    score = clip(28 + hits * 9)
    if "敏感性" in report.body or "sensitivity" in text:
        score = clip(score + 10)
    return FactorScore(name="估值严谨度", score=score, weight=0.18, rationale=f"估值方法线索 {hits}")


def _risks(report: ResearchReport, text: str) -> FactorScore:
    hits = sum(1 for k in RISK_HINTS if k in text)
    boilerplate = sum(1 for k in BOILERPLATE_RISK if k in report.body or k in text)
    score = clip(25 + hits * 10 - boilerplate * 8)
    return FactorScore(
        name="风险披露",
        score=score,
        weight=0.17,
        rationale=f"风险线索 {hits}，模板风险 {boilerplate}",
    )


def _independence(report: ResearchReport) -> FactorScore:
    score = 72.0
    if report.broker_is_underwriter:
        score -= 25
    if report.has_initiation and report.rating in {"buy", "overweight"}:
        score -= 10
    if report.rating == "sell":
        score += 8
    return FactorScore(
        name="独立性",
        score=clip(score),
        weight=0.15,
        rationale="承销/首覆买入会降低独立权重；卖方卖出评级更稀缺",
    )


def _price_discipline(report: ResearchReport) -> FactorScore:
    if not report.target_price or not report.current_price or report.current_price <= 0:
        return FactorScore(name="目标价纪律", score=45.0, weight=0.10, rationale="无目标价或现价，无法检验")
    upside = report.target_price / report.current_price - 1.0
    if upside > 0.8:
        score, why = 28.0, f"隐含上行 {upside:.0%} 过高，需拆假设"
    elif upside > 0.45:
        score, why = 50.0, f"隐含上行 {upside:.0%}，偏乐观"
    elif -0.1 <= upside <= 0.35:
        score, why = 78.0, f"隐含上行 {upside:.0%}，与评级大致匹配"
    else:
        score, why = 60.0, f"隐含上行 {upside:.0%}，评级与价格可能不一致"
    if report.rating == "hold" and upside > 0.3:
        score -= 15
        why += "；持有评级却给高空间"
    return FactorScore(name="目标价纪律", score=clip(score), weight=0.10, rationale=why)


def _has_any(text: str, keys: tuple[str, ...]) -> bool:
    return any(k in text for k in keys)


def _sentences(body: str) -> list[str]:
    parts = re.split(r"(?<=[。！？.!?])\s*", body.strip())
    return [p.strip() for p in parts if len(p.strip()) >= 8]


def _numbers(body: str) -> list[str]:
    return re.findall(r"\d+(?:\.\d+)?%?|\d+(?:\.\d+)?x", body)[:30]
