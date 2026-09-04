"""Optional Yahoo Finance overlay for prices and a few fundamentals.

Network failures, missing fields, and a missing yfinance install all fall back
to the sample universe. Nothing here is investment advice.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass, field, replace
from datetime import datetime, timezone
from typing import Callable, Iterable, Iterator
import math

from quant.models import Stock
from quant.sample_data import STOCKS

QUOTE_FIELDS = ("price", "change_pct", "pe_ttm", "pb", "dividend_yield", "roe")

Fetcher = Callable[[list[str]], dict[str, dict]]


@dataclass(frozen=True)
class LiveQuote:
    """Partial quote. None means 'leave the sample value'."""

    price: float | None = None
    change_pct: float | None = None  # decimal, 0.012 = +1.2%
    pe_ttm: float | None = None
    pb: float | None = None
    dividend_yield: float | None = None
    roe: float | None = None
    as_of: str | None = None
    source: str = "yahoo"


@dataclass
class LiveMeta:
    enabled: bool
    source: str = "sample"
    applied: int = 0
    ok: list[str] = field(default_factory=list)
    failed: list[str] = field(default_factory=list)
    fetched_at: str | None = None
    fallback: bool = False
    rescored: bool = False
    quotes: dict[str, LiveQuote] = field(default_factory=dict)

    def as_dict(self) -> dict:
        return {
            "enabled": self.enabled,
            "source": self.source,
            "applied": self.applied,
            "ok": list(self.ok),
            "failed": list(self.failed),
            "fetched_at": self.fetched_at,
            "fallback": self.fallback,
            "rescored": self.rescored,
        }


_active_quotes: dict[str, LiveQuote] = {}


def active_quotes() -> dict[str, LiveQuote]:
    return dict(_active_quotes)


def to_yahoo_symbol(symbol: str) -> str:
    """Map internal codes to Yahoo tickers (HKEX 5-digit → 4-digit)."""
    raw = symbol.strip().upper()
    if raw.endswith(".HK"):
        digits = raw[: -len(".HK")]
        if digits.isdigit():
            return f"{int(digits):04d}.HK"
    return raw


def parse_yahoo_payload(payload: dict) -> LiveQuote | None:
    """Best-effort parse of yfinance info / fast_info / quote dicts."""
    price = _first_num(
        payload,
        "currentPrice",
        "regularMarketPrice",
        "last_price",
        "lastPrice",
        "previousClose",
    )
    change = _first_num(payload, "regularMarketChangePercent", "regularMarketChangePercentRaw")
    if change is not None:
        change = change / 100.0
    pe = _first_num(payload, "trailingPE")
    if pe is not None and pe <= 0:
        pe = None
    pb = _first_num(payload, "priceToBook")
    if pb is not None and pb <= 0:
        pb = None
    div = _first_num(payload, "trailingAnnualDividendYield", "dividendYield", "yield")
    if div is not None:
        div = _as_ratio(div, percent_if_gt=1.0)
        if div is not None and div < 0:
            div = None
    roe = _first_num(payload, "returnOnEquity")
    if roe is not None:
        roe = _as_ratio(roe, percent_if_gt=5.0)
    if all(v is None for v in (price, change, pe, pb, div, roe)):
        return None
    return LiveQuote(
        price=price,
        change_pct=change,
        pe_ttm=pe,
        pb=pb,
        dividend_yield=div,
        roe=roe,
        as_of=_as_of(payload),
        source="yahoo",
    )


def apply_quote(stock: Stock, quote: LiveQuote | None) -> Stock:
    if quote is None:
        return stock
    kwargs: dict = {}
    if quote.price is not None:
        kwargs["price"] = quote.price
    if quote.pe_ttm is not None:
        kwargs["pe_ttm"] = quote.pe_ttm
    if quote.pb is not None:
        kwargs["pb"] = quote.pb
    if quote.dividend_yield is not None:
        kwargs["dividend_yield"] = quote.dividend_yield
    if quote.roe is not None:
        kwargs["financials"] = replace(stock.financials, roe=quote.roe)
    if not kwargs:
        return stock
    return replace(stock, **kwargs)


def field_sources(quote: LiveQuote | None) -> dict[str, str]:
    sources = {name: "sample" for name in QUOTE_FIELDS}
    if quote is None:
        return sources
    for name in QUOTE_FIELDS:
        if getattr(quote, name) is not None:
            sources[name] = "yahoo"
    return sources


def quote_block(quote: LiveQuote | None) -> dict:
    sources = field_sources(quote)
    yahoo_n = sum(1 for v in sources.values() if v == "yahoo")
    if yahoo_n == 0:
        source = "sample"
    elif yahoo_n == len(sources):
        source = "yahoo"
    else:
        source = "mixed"
    return {
        "source": source,
        "as_of": quote.as_of if quote else None,
        "fields": sources,
    }


def fetch_live_quotes(
    symbols: Iterable[str],
    *,
    fetcher: Fetcher | None = None,
) -> dict[str, LiveQuote]:
    ordered = [s for s in symbols]
    if not ordered:
        return {}
    fetch = fetcher or _yfinance_fetcher
    yahoo_syms = [to_yahoo_symbol(s) for s in ordered]
    try:
        raw = fetch(yahoo_syms) or {}
    except Exception:
        return {}
    by_yahoo = {to_yahoo_symbol(s): s for s in ordered}
    out: dict[str, LiveQuote] = {}
    for ysym, payload in raw.items():
        ours = by_yahoo.get(str(ysym).upper()) or by_yahoo.get(str(ysym))
        if ours is None or not isinstance(payload, dict):
            continue
        parsed = parse_yahoo_payload(payload)
        if parsed is not None:
            out[ours] = parsed
    return out


def sample_live_meta() -> LiveMeta:
    return LiveMeta(enabled=False, source="sample")


def disclaimer_for(meta: LiveMeta) -> str:
    if not meta.enabled:
        return "样本数据仅供方法演示，不构成投资建议，也不是实时行情。"
    if meta.fallback or meta.applied == 0:
        return "实时行情获取失败，已回退全部样本数据。样本与实时数据均不构成投资建议。"
    if meta.rescored:
        return (
            "部分现价与 PE/PB/股息/ROE 来自 Yahoo Finance 公开行情，并已用于重算研究分；"
            "接口失败的字段仍用样本。均不构成投资建议。"
        )
    return (
        "部分现价与 PE/PB/股息/ROE 来自 Yahoo Finance 公开行情；"
        "质量、估值与策略分仍基于研究样本财务。均不构成投资建议。"
    )


@contextmanager
def live_session(enabled: bool, *, fetcher: Fetcher | None = None) -> Iterator[LiveMeta]:
    """Patch STOCKS in place while the CLI command runs, then restore samples."""
    global _active_quotes
    if not enabled:
        _active_quotes = {}
        yield sample_live_meta()
        return
    symbols = list(STOCKS)
    quotes = fetch_live_quotes(symbols, fetcher=fetcher)
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    if not quotes:
        _active_quotes = {}
        yield LiveMeta(
            enabled=True,
            source="sample",
            applied=0,
            ok=[],
            failed=symbols,
            fetched_at=now,
            fallback=True,
            rescored=False,
        )
        return
    backup = dict(STOCKS)
    ok = sorted(quotes)
    failed = sorted(s for s in symbols if s not in quotes)
    for symbol, quote in quotes.items():
        STOCKS[symbol] = apply_quote(STOCKS[symbol], quote)
    _active_quotes = dict(quotes)
    try:
        yield LiveMeta(
            enabled=True,
            source="yahoo",
            applied=len(quotes),
            ok=ok,
            failed=failed,
            fetched_at=now,
            fallback=False,
            rescored=True,
            quotes=quotes,
        )
    finally:
        STOCKS.clear()
        STOCKS.update(backup)
        _active_quotes = {}


def _yfinance_fetcher(yahoo_symbols: list[str]) -> dict[str, dict]:
    try:
        import yfinance as yf  # type: ignore
    except ImportError as exc:
        raise RuntimeError("yfinance is not installed; pip install '.[live]'") from exc
    out: dict[str, dict] = {}
    for ysym in yahoo_symbols:
        try:
            ticker = yf.Ticker(ysym)
            payload: dict = {}
            try:
                info = ticker.info
                if isinstance(info, dict):
                    payload.update({k: v for k, v in info.items() if v is not None})
            except Exception:
                pass
            try:
                fast = ticker.fast_info
                if fast is not None:
                    for key in ("last_price", "lastPrice", "regularMarketPrice", "previous_close"):
                        val = _mapping_get(fast, key)
                        if val is None:
                            continue
                        payload.setdefault(key, val)
                        if key in ("last_price", "lastPrice"):
                            payload.setdefault("currentPrice", val)
            except Exception:
                pass
            if payload:
                out[ysym] = payload
        except Exception:
            continue
    return out


def _mapping_get(obj, key: str):
    if obj is None:
        return None
    try:
        if hasattr(obj, "get"):
            return obj.get(key)
    except Exception:
        pass
    try:
        return obj[key]
    except Exception:
        return getattr(obj, key, None)


def _first_num(payload: dict, *keys: str) -> float | None:
    for key in keys:
        n = _num(payload.get(key))
        if n is not None:
            return n
    return None


def _num(value) -> float | None:
    if value is None or isinstance(value, (bool, list, tuple, dict)):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number):
        return None
    return number


def _as_ratio(value: float, *, percent_if_gt: float) -> float | None:
    if abs(value) > percent_if_gt:
        return value / 100.0
    return value


def _as_of(payload: dict) -> str:
    raw = payload.get("regularMarketTime") or payload.get("time")
    if isinstance(raw, datetime):
        stamp = raw if raw.tzinfo else raw.replace(tzinfo=timezone.utc)
        return stamp.replace(microsecond=0).isoformat()
    try:
        if raw is not None:
            return datetime.fromtimestamp(float(raw), tz=timezone.utc).replace(microsecond=0).isoformat()
    except (TypeError, ValueError, OSError, OverflowError):
        pass
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
