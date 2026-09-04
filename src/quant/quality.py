"""Quality / franchise scoring, with market-specific governance overlays."""

from __future__ import annotations

from quant.models import FactorScore, Market, ScoreBreakdown, SectorStyle, Stock
from quant.scoring import breakdown, clip, scale


def score_quality(stock: Stock) -> ScoreBreakdown:
    f = stock.financials
    factors = [
        _profitability(stock),
        _cash_conversion(stock),
        _balance_sheet(stock),
        _stability(stock),
        _governance(stock),
    ]
    result = breakdown(factors)
    if f.related_party_ratio > 0.15:
        result.flags.append("关联交易占比偏高")
    if stock.market == Market.HK and stock.dual_class:
        result.flags.append("不同投票权：控制权与经济权分离")
    if f.receivable_days > 150:
        result.flags.append("应收账款天数过长，需核对应收质量")
    return result


def _profitability(stock: Stock) -> FactorScore:
    f = stock.financials
    roe_s = scale(f.roe, 0.04, 0.28)
    roic_s = scale(f.roic, 0.03, 0.22)
    margin_s = scale(f.net_margin, 0.02, 0.25)
    score = 0.4 * roe_s + 0.4 * roic_s + 0.2 * margin_s
    if stock.style == SectorStyle.FINANCIAL and f.core_tier1:
        score = 0.6 * roe_s + 0.4 * scale(f.core_tier1, 0.08, 0.16)
    return FactorScore(
        name="盈利能力",
        score=score,
        weight=0.25,
        rationale=f"ROE {f.roe:.1%} / ROIC {f.roic:.1%} / 净利率 {f.net_margin:.1%}",
        inputs={"roe": f.roe, "roic": f.roic, "net_margin": f.net_margin},
    )


def _cash_conversion(stock: Stock) -> FactorScore:
    f = stock.financials
    if abs(f.net_income) < 1e-9:
        ocf_ratio, fcf_ratio = 0.0, 0.0
    else:
        ocf_ratio = f.operating_cash_flow / f.net_income
        fcf_ratio = f.free_cash_flow / f.net_income
    ocf_s = scale(ocf_ratio, 0.4, 1.4)
    fcf_s = scale(fcf_ratio, 0.0, 1.2)
    score = 0.55 * ocf_s + 0.45 * fcf_s
    if stock.style == SectorStyle.FINANCIAL:
        score = scale(f.operating_cash_flow / max(f.net_income, 1.0), 0.6, 1.3)
    return FactorScore(
        name="现金流转化",
        score=score,
        weight=0.20,
        rationale=f"OCF/NI {ocf_ratio:.2f}，FCF/NI {fcf_ratio:.2f}",
        inputs={"ocf_ni": ocf_ratio, "fcf_ni": fcf_ratio},
    )


def _balance_sheet(stock: Stock) -> FactorScore:
    f = stock.financials
    ebitda = max(f.ebitda, 1.0)
    net_debt = stock.net_debt
    leverage = net_debt / ebitda
    current = f.current_assets / max(f.current_liabilities, 1.0)
    coverage = f.ebit / max(f.interest_expense, 1.0)
    lev_s = scale(leverage, -1.0, 3.5, invert=True)
    cur_s = scale(current, 0.8, 2.2)
    cov_s = scale(coverage, 2.0, 15.0)
    score = 0.45 * lev_s + 0.25 * cur_s + 0.30 * cov_s
    if stock.style == SectorStyle.FINANCIAL:
        npl = f.npl_ratio if f.npl_ratio is not None else 0.02
        cet1 = f.core_tier1 if f.core_tier1 is not None else 0.11
        score = 0.55 * scale(npl, 0.005, 0.025, invert=True) + 0.45 * scale(cet1, 0.09, 0.16)
        rationale = f"NPL {npl:.2%} / CET1 {cet1:.1%}"
    else:
        rationale = f"净负债/EBITDA {leverage:.1f}x，流动比 {current:.2f}，利息覆盖 {coverage:.1f}x"
    return FactorScore(
        name="资产负债表",
        score=clip(score),
        weight=0.20,
        rationale=rationale,
        inputs={"leverage": leverage, "current_ratio": current, "interest_coverage": coverage},
    )


def _stability(stock: Stock) -> FactorScore:
    f = stock.financials
    growth = 0.5 * scale(f.revenue_cagr_3y, -0.05, 0.25) + 0.5 * scale(f.eps_cagr_3y, -0.08, 0.28)
    vol = scale(f.earnings_volatility, 0.05, 0.55, invert=True)
    dilution = scale(f.shares_dilution_3y, 0.0, 0.15, invert=True)
    score = 0.45 * growth + 0.35 * vol + 0.20 * dilution
    return FactorScore(
        name="增长与稳定性",
        score=score,
        weight=0.20,
        rationale=(
            f"收入CAGR {f.revenue_cagr_3y:.1%}，EPS CAGR {f.eps_cagr_3y:.1%}，"
            f"盈利波动 {f.earnings_volatility:.2f}"
        ),
        inputs={
            "revenue_cagr_3y": f.revenue_cagr_3y,
            "eps_cagr_3y": f.eps_cagr_3y,
            "earnings_volatility": f.earnings_volatility,
        },
    )


def _governance(stock: Stock) -> FactorScore:
    f = stock.financials
    score = 78.0
    flags = []
    if f.related_party_ratio > 0.08:
        score -= min(25.0, f.related_party_ratio * 120)
        flags.append("关联交易")
    if f.receivable_days > 120:
        score -= min(15.0, (f.receivable_days - 120) * 0.12)
        flags.append("应收偏长")
    if stock.dual_class:
        score -= 8.0
        flags.append("同股不同权")
    if f.shares_dilution_3y > 0.08:
        score -= 10.0
        flags.append("股本稀释")
    if stock.market == Market.HK and stock.price < 1.0 and stock.market_cap < 2e9:
        score -= 12.0
        flags.append("小盘低价港股需防老千特征")
    if stock.market == Market.A_SHARE and f.inventory_days > 180 and stock.style != SectorStyle.CONSUMER:
        score -= 6.0
    rationale = "治理未见明显红旗" if not flags else "关注：" + " / ".join(flags)
    return FactorScore(
        name="治理与财务质量",
        score=clip(score),
        weight=0.15,
        rationale=rationale,
        inputs={"related_party_ratio": f.related_party_ratio, "receivable_days": f.receivable_days},
    )
