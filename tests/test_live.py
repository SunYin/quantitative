import json
from pathlib import Path

from quant.cli import main
from quant.live import (
    LiveQuote,
    apply_quote,
    fetch_live_quotes,
    field_sources,
    live_session,
    parse_yahoo_payload,
    to_yahoo_symbol,
)
from quant.sample_data import STOCKS, universe


def test_yahoo_symbol_mapping():
    assert to_yahoo_symbol("00700.HK") == "0700.HK"
    assert to_yahoo_symbol("03690.HK") == "3690.HK"
    assert to_yahoo_symbol("3750.HK") == "3750.HK"
    assert to_yahoo_symbol("3968.HK") == "3968.HK"
    assert to_yahoo_symbol("600519.SS") == "600519.SS"
    assert to_yahoo_symbol("AAPL") == "AAPL"


def test_overlay_keeps_missing_fundamentals():
    stock = STOCKS["AAPL"]
    quote = LiveQuote(price=250.0, change_pct=0.012, pe_ttm=None, pb=None)
    out = apply_quote(stock, quote)
    assert out.price == 250.0
    assert out.pe_ttm == stock.pe_ttm
    assert out.pb == stock.pb
    assert out.financials.roe == stock.financials.roe
    sources = field_sources(quote)
    assert sources["price"] == "yahoo"
    assert sources["pe_ttm"] == "sample"
    assert sources["roe"] == "sample"


def test_parse_skips_non_finite_and_normalizes_percents():
    parsed = parse_yahoo_payload(
        {
            "currentPrice": 100,
            "regularMarketChangePercent": 1.5,
            "trailingPE": float("inf"),
            "priceToBook": 3.2,
            "dividendYield": 2.0,
            "returnOnEquity": 31.0,
        }
    )
    assert parsed is not None
    assert parsed.price == 100
    assert abs(parsed.change_pct - 0.015) < 1e-9
    assert parsed.pe_ttm is None
    assert parsed.pb == 3.2
    assert abs(parsed.dividend_yield - 0.02) < 1e-9
    assert abs(parsed.roe - 0.31) < 1e-9


def test_fetch_fallback_on_provider_error():
    def boom(_symbols):
        raise RuntimeError("yahoo down")

    assert fetch_live_quotes(["AAPL", "00700.HK"], fetcher=boom) == {}


def test_fetch_partial_universe():
    def fake(yahoo_symbols):
        assert "0700.HK" in yahoo_symbols
        return {"0700.HK": {"currentPrice": 399.0, "trailingPE": 18.2}}

    quotes = fetch_live_quotes(["00700.HK", "AAPL"], fetcher=fake)
    assert "00700.HK" in quotes
    assert quotes["00700.HK"].price == 399.0
    assert "AAPL" not in quotes


def test_live_session_restores_sample_universe():
    before = STOCKS["AAPL"].price

    def fake(_symbols):
        return {"AAPL": {"currentPrice": 1.0, "trailingPE": 9.0}}

    with live_session(True, fetcher=fake) as meta:
        assert STOCKS["AAPL"].price == 1.0
        assert meta.applied == 1
        assert meta.rescored
        assert "AAPL" in meta.ok

    assert STOCKS["AAPL"].price == before


def test_cli_json_live_degrades(tmp_path: Path, monkeypatch):
    monkeypatch.setattr("quant.live.fetch_live_quotes", lambda *_a, **_k: {})
    out = tmp_path / "snap.json"
    assert main(["json", "--live", "-o", str(out)]) == 0
    payload = json.loads(out.read_text(encoding="utf-8"))
    assert len(payload["briefs"]) == len(universe())
    assert payload["live"]["enabled"] is True
    assert payload["live"]["applied"] == 0
    assert payload["live"]["fallback"] is True
    assert payload["disclaimer"]
    assert "不构成投资建议" in payload["disclaimer"]


def test_cli_json_live_mixed_fields(tmp_path: Path, monkeypatch):
    sample_pe = STOCKS["AAPL"].pe_ttm
    sample_price = STOCKS["AAPL"].price

    def fake(_symbols, **_kwargs):
        return {
            "AAPL": LiveQuote(
                price=188.0,
                change_pct=0.01,
                pe_ttm=None,
                pb=48.0,
                dividend_yield=0.004,
                roe=None,
                as_of="2026-09-04T00:00:00+00:00",
            )
        }

    monkeypatch.setattr("quant.live.fetch_live_quotes", fake)
    out = tmp_path / "snap.json"
    assert main(["json", "--live", "-o", str(out)]) == 0
    payload = json.loads(out.read_text(encoding="utf-8"))
    aapl = next(row for row in payload["briefs"] if row["symbol"] == "AAPL")
    assert aapl["price"] == 188.0
    assert aapl["pe_ttm"] == sample_pe
    assert aapl["pb"] == 48.0
    assert aapl["quote"]["fields"]["price"] == "yahoo"
    assert aapl["quote"]["fields"]["pe_ttm"] == "sample"
    assert aapl["quote"]["fields"]["roe"] == "sample"
    assert STOCKS["AAPL"].price == sample_price


def test_cli_analyze_live_fallback(monkeypatch, capsys):
    monkeypatch.setattr("quant.live.fetch_live_quotes", lambda *_a, **_k: {})
    assert main(["analyze", "00700.HK", "--live"]) == 0
    out = capsys.readouterr().out
    assert "腾讯" in out
    assert "质量" in out
