"""JSON snapshot of the research universe for the dashboard."""

from __future__ import annotations

import json
from pathlib import Path

from quant.markets import CONNECT_RULES, PROFILES
from quant.models import Market, ScoreBreakdown, Stock
from quant.scorecard import build_universe_scorecard
from quant.strategies import StrategyResult


def snapshot(card: dict | None = None) -> dict:
    card = card or build_universe_scorecard()
    return {
        "as_of": card["as_of"],
        "disclaimer": card["disclaimer"],
        "briefs": [_brief(b) for b in card["briefs"]],
        "strategies": [_strategy(result) for result in card["strategies"].values()],
        "industries": [_industry(row) for row in card["industries"]],
        "reports": [_report(row) for row in card["reports"]],
        "markets": [_market(m) for m in Market],
        "connect": dict(CONNECT_RULES),
        "checklist": list(card["checklist"]),
    }


def write_snapshot(path: str | Path) -> Path:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(snapshot(), ensure_ascii=False, indent=2), encoding="utf-8")
    return target


def _score(block: ScoreBreakdown) -> dict:
    return {
        "total": round(block.total, 1),
        "grade": block.grade,
        "flags": list(block.flags),
        "factors": [
            {
                "name": f.name,
                "score": round(f.score, 1),
                "weight": f.weight,
                "rationale": f.rationale,
            }
            for f in block.factors
        ],
    }


def _stock(stock: Stock) -> dict:
    return {
        "symbol": stock.symbol,
        "name": stock.name,
        "name_en": stock.name_en,
        "market": stock.market.value,
        "board": stock.board,
        "sector": stock.sector,
        "industry": stock.industry,
        "currency": stock.currency,
        "southbound_eligible": stock.southbound_eligible,
        "northbound_eligible": stock.northbound_eligible,
        "ah_pair_symbol": stock.ah_pair_symbol,
        "notes": stock.notes,
        "pe_ttm": stock.pe_ttm,
        "pb": stock.pb,
        "fcf_yield": stock.fcf_yield,
        "dividend_yield": stock.dividend_yield,
    }


def _brief(brief: dict) -> dict:
    stock = brief["stock"]
    return {
        **_stock(stock),
        "composite": brief["composite"],
        "quality": _score(brief["quality"]),
        "valuation": _score(brief["valuation"]),
        "position_cap": brief["position_cap"],
        "connect": brief["connect"],
    }


def _strategy(result: StrategyResult) -> dict:
    return {
        "id": _strategy_id(result.name),
        "name": result.name,
        "objective": result.objective,
        "notes": list(result.notes),
        "rows": [
            {
                "symbol": row.symbol,
                "name": row.name,
                "market": row.market,
                "score": row.score,
                "action": row.action,
                "reason": row.reason,
                "extras": {k: _jsonable(v) for k, v in row.extras.items()},
            }
            for row in result.ranked()
        ],
    }


def _industry(row: dict) -> dict:
    item, scored = row["industry"], row["score"]
    return {
        "name": item.name,
        "name_en": item.name_en,
        "markets": [m.value for m in item.markets],
        "cycle_position": item.cycle_position,
        "notes": item.notes,
        "leaders": list(item.leaders),
        "score": _score(scored),
    }


def _report(row: dict) -> dict:
    report, scored = row["report"], row["score"]
    return {
        "id": row["id"],
        "title": report.title,
        "broker": report.broker,
        "symbol": report.symbol,
        "rating": report.rating,
        "target_price": report.target_price,
        "current_price": report.current_price,
        "published": report.published,
        "body": report.body,
        "score": _score(scored),
        "claims": row["claims"],
    }


def _market(market: Market) -> dict:
    profile = PROFILES[market]
    return {
        "market": profile.market.value,
        "currency": profile.currency,
        "settlement": profile.settlement,
        "price_limit": profile.price_limit,
        "lot_convention": profile.lot_convention,
        "shorting": profile.shorting,
        "primary_research": profile.primary_research,
        "key_flows": profile.key_flows,
        "valuation_habit": profile.valuation_habit,
        "governance_focus": list(profile.governance_focus),
        "industry_taxonomy": profile.industry_taxonomy,
    }


def _strategy_id(name: str) -> str:
    mapping = {
        "质量-价值": "quality_value",
        "A/H 溢价": "ah_premium",
        "行业轮动": "industry_rotation",
        "互联互通资金": "connect_flow",
    }
    return mapping.get(name, name)


def _jsonable(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float, str)):
        return value
    return str(value)
