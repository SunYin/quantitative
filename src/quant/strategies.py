"""Cross-market research strategies. Signals are for study, not orders."""

from __future__ import annotations

from dataclasses import dataclass, field

from quant.industry import score_industry
from quant.markets import connect_status, fx_to_hkd
from quant.models import IndustrySnapshot, Market, Stock
from quant.quality import score_quality
from quant.sample_data import CONNECT_FLOWS, STOCKS, industries, universe
from quant.technical import position_cap, score_technical
from quant.valuation import implied_upside, score_valuation


@dataclass
class StrategyRow:
    symbol: str
    name: str
    market: str
    score: float
    action: str
    reason: str
    extras: dict[str, float | str] = field(default_factory=dict)


@dataclass
class StrategyResult:
    name: str
    objective: str
    rows: list[StrategyRow]
    notes: list[str]

    def ranked(self) -> list[StrategyRow]:
        return sorted(self.rows, key=lambda r: r.score, reverse=True)


def quality_value(stocks: list[Stock] | None = None) -> StrategyResult:
    """Buy quality at a reasonable price, market-aware."""
    rows = []
    for stock in stocks or universe():
        q = score_quality(stock)
        v = score_valuation(stock)
        t = score_technical(stock)
        blended = 0.45 * q.total + 0.40 * v.total + 0.15 * t.total
        upside = implied_upside(stock)
        if q.total >= 70 and v.total >= 60:
            action = "重点研究"
        elif q.total >= 60 and v.total >= 50:
            action = "观察名单"
        elif q.total < 45:
            action = "质量不足"
        else:
            action = "估值偏贵或中性"
        rows.append(
            StrategyRow(
                symbol=stock.symbol,
                name=stock.name,
                market=stock.market.value,
                score=round(blended, 1),
                action=action,
                reason=f"质量 {q.total:.0f} / 估值 {v.total:.0f} / 技术 {t.total:.0f}",
                extras={
                    "quality": q.total,
                    "valuation": v.total,
                    "position_cap": position_cap(stock, q.total, v.total),
                    "implied_upside": round(upside, 3) if upside is not None else "",
                },
            )
        )
    return StrategyResult(
        name="质量-价值",
        objective="在三个市场用同一套质量门槛，再用当地估值习惯给安全边际。",
        rows=rows,
        notes=[
            "A 股同样质量通常更贵，不应用港股的 PE 直接横比。",
            "金融股以 PB/ROE 和资产质量为主，不要强行看 EV/EBITDA。",
        ],
    )


def ah_premium(stocks: list[Stock] | None = None) -> StrategyResult:
    """Measure A/H premium; do not treat it as risk-free arb."""
    book = {s.symbol: s for s in (stocks or universe())}
    pairs: dict[str, tuple[Stock, Stock]] = {}
    for stock in book.values():
        if stock.market != Market.A_SHARE or not stock.ah_pair_symbol:
            continue
        h = book.get(stock.ah_pair_symbol)
        if h:
            pairs[stock.symbol] = (stock, h)

    rows = []
    for a, h in pairs.values():
        a_in_hkd = a.price * fx_to_hkd(a.currency)
        premium = a_in_hkd / h.price - 1.0
        q = score_quality(a)
        if premium >= 0.35 and q.total >= 60:
            action = "关注 H 股相对折价"
        elif premium <= 0.05 and q.total >= 60:
            action = "A/H 价差收窄，溢价交易拥挤"
        else:
            action = "价差中性，先看基本面"
        rows.append(
            StrategyRow(
                symbol=f"{a.symbol} / {h.symbol}",
                name=f"{a.name} A/H",
                market="AH",
                score=round(max(0.0, min(100.0, 70 + (q.total - 60) * 0.4 - abs(premium - 0.15) * 80)), 1),
                action=action,
                reason=f"A 股相对 H 股溢价 {premium:.1%}（样本汇率）",
                extras={
                    "ah_premium": round(premium, 4),
                    "southbound": h.southbound_eligible,
                    "quality": q.total,
                },
            )
        )
    return StrategyResult(
        name="A/H 溢价",
        objective="解释两地价差的投资者结构，而不是假设可以瞬间抹平。",
        rows=rows,
        notes=[
            "A 与 H 是不同股份，税费、借券、额度与结算都不同。",
            "港股通让价差可以收窄，但不能消灭流动性折价和治理折价。",
        ],
    )


def industry_rotation(items: list[IndustrySnapshot] | None = None) -> StrategyResult:
    rows = []
    for industry in items or industries():
        scored = score_industry(industry)
        if scored.total >= 70:
            action = "超配研究"
        elif scored.total >= 55:
            action = "标配"
        else:
            action = "低配/等待更好价格"
        rows.append(
            StrategyRow(
                symbol=industry.name,
                name=industry.name_en,
                market="/".join(m.value for m in industry.markets),
                score=scored.total,
                action=action,
                reason=f"{scored.grade}；周期 {industry.cycle_position}；估值分位 {industry.valuation_percentile:.0f}",
                extras={"grade": scored.grade, "policy": industry.policy_score},
            )
        )
    return StrategyResult(
        name="行业轮动",
        objective="先给行业打分，再在行业里挑质量股，避免先选故事再找行业。",
        rows=rows,
        notes=["政策分对 A 股/港股权重大，对美股权重应下调。"],
    )


def connect_flow(stocks: list[Stock] | None = None) -> StrategyResult:
    rows = []
    for stock in stocks or universe():
        flow = CONNECT_FLOWS.get(stock.symbol)
        if not flow:
            continue
        status = connect_status(stock)
        change = flow.get("southbound_holding_change_20d", flow.get("northbound_holding_change_20d", 0.0))
        q = score_quality(stock)
        v = score_valuation(stock)
        score = 50 + change * 800 + (q.total - 60) * 0.4 + (v.total - 50) * 0.2
        if change >= 0.01 and q.total >= 60:
            action = "资金与质量同向，纳入跟踪"
        elif change <= -0.005 and v.total < 45:
            action = "资金流出且不便宜，降优先级"
        else:
            action = "资金噪声，不单独作为买卖点"
        direction = "南向" if stock.market == Market.HK else "北向"
        rows.append(
            StrategyRow(
                symbol=stock.symbol,
                name=stock.name,
                market=stock.market.value,
                score=round(score, 1),
                action=action,
                reason=f"{direction} 20日持股变化 {change:+.1%}；{status['implication']}",
                extras={"flow_20d": change, "quality": q.total},
            )
        )
    return StrategyResult(
        name="互联互通资金",
        objective="把港股通/北向当成拥挤度与边际定价，而不是基本面证据。",
        rows=rows,
        notes=[
            "南向持股集中在少数龙头，排名变化比绝对买入更有信息。",
            "额度打满的日子信号失效，应标记为微观结构事件。",
        ],
    )


def run_all_strategies() -> dict[str, StrategyResult]:
    return {
        "quality_value": quality_value(),
        "ah_premium": ah_premium(),
        "industry_rotation": industry_rotation(),
        "connect_flow": connect_flow(),
    }


def stock_brief(symbol: str) -> dict:
    stock = STOCKS[symbol] if symbol in STOCKS else None
    if stock is None:
        from quant.sample_data import get_stock

        stock = get_stock(symbol)
    q = score_quality(stock)
    v = score_valuation(stock)
    t = score_technical(stock)
    return {
        "stock": stock,
        "quality": q,
        "valuation": v,
        "technical": t,
        "connect": connect_status(stock),
        "position_cap": position_cap(stock, q.total, v.total),
        "composite": round(0.45 * q.total + 0.40 * v.total + 0.15 * t.total, 1),
    }
