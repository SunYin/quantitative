"""JSON snapshot of the research universe for the dashboard."""

from __future__ import annotations

import json
from pathlib import Path

from quant.i18n import catalog_payload
from quant.live import LiveMeta, LiveQuote, active_quotes, quote_block, sample_live_meta
from quant.markets import CONNECT_RULES, PROFILES
from quant.models import Market, ScoreBreakdown, Stock
from quant.scorecard import build_universe_scorecard
from quant.strategies import StrategyResult


def snapshot(card: dict | None = None, live: LiveMeta | None = None) -> dict:
    from quant.live import disclaimer_for

    live = live or sample_live_meta()
    card = card or build_universe_scorecard(disclaimer=disclaimer_for(live))
    return {
        "as_of": card["as_of"],
        "disclaimer": card["disclaimer"],
        "live": live.as_dict(),
        "briefs": [_brief(b, live.quotes.get(b["stock"].symbol) or active_quotes().get(b["stock"].symbol)) for b in card["briefs"]],
        "strategies": [_strategy(result) for result in card["strategies"].values()],
        "industries": [_industry(row) for row in card["industries"]],
        "chains": [_chain(row) for row in card.get("chains", [])],
        "reports": [_report(row) for row in card["reports"]],
        "markets": [_market(m) for m in Market],
        "connect": dict(CONNECT_RULES),
        "checklist": list(card["checklist"]),
        "i18n": catalog_payload(),
    }


def write_snapshot(path: str | Path, live: LiveMeta | None = None) -> Path:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(snapshot(live=live), ensure_ascii=False, indent=2), encoding="utf-8")
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
        "price": stock.price,
        "change_pct": None,
        "pe_ttm": stock.pe_ttm,
        "pb": stock.pb,
        "fcf_yield": stock.fcf_yield,
        "dividend_yield": stock.dividend_yield,
        "roe": stock.financials.roe,
    }


def _brief(brief: dict, quote: LiveQuote | None = None) -> dict:
    stock = brief["stock"]
    row = {
        **_stock(stock),
        "composite": brief["composite"],
        "quality": _score(brief["quality"]),
        "valuation": _score(brief["valuation"]),
        "position_cap": brief["position_cap"],
        "connect": brief["connect"],
        "quote": quote_block(quote),
    }
    if quote is not None and quote.change_pct is not None:
        row["change_pct"] = quote.change_pct
    return row


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
    from quant.sample_data import industry_constituents as members_of

    item, scored = row["industry"], row["score"]
    stocks = members_of(item)
    return {
        "name": item.name,
        "name_en": item.name_en,
        "markets": [m.value for m in item.markets],
        "cycle_position": item.cycle_position,
        "notes": item.notes,
        "leaders": list(item.leaders),
        "aliases": list(item.aliases),
        "constituents": [
            {
                "symbol": stock.symbol,
                "name": stock.name,
                "name_en": stock.name_en,
                "market": stock.market.value,
            }
            for stock in stocks
        ],
        "score": _score(scored),
    }


def _chain(row: dict) -> dict:
    chain, layers = row["chain"], row["layers"]
    return {
        "id": chain.id,
        "name": chain.name,
        "name_en": chain.name_en,
        "aliases": list(chain.aliases),
        "thesis": chain.thesis,
        "notes": chain.notes,
        "layers": [
            {
                "role": layer["role"],
                "role_zh": layer["role_zh"],
                "industry": layer["industry"].name,
                "industry_en": layer["industry"].name_en,
                "captures": layer["captures"],
                "bottleneck": layer["bottleneck"],
                "score": _score(layer["score"]),
                "stocks": [
                    {
                        "symbol": stock.symbol,
                        "name": stock.name,
                        "name_en": stock.name_en,
                        "market": stock.market.value,
                    }
                    for stock in layer["stocks"]
                ],
            }
            for layer in layers
        ],
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
