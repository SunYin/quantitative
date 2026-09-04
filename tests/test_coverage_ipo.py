from quant.cli import main
from quant.export import snapshot
from quant.models import Market
from quant.quality import score_quality
from quant.sample_data import coverage, get_ipo, get_stock, industries, ipos, universe
from quant.valuation import score_valuation


def test_industry_count_and_new_slices():
    names = {item.name for item in industries()}
    assert len(names) >= 16
    assert {"创新药", "保险", "光伏", "石油", "公用事业", "交易所"} <= names
    assert all(item.constituents or item.leaders for item in industries())


def test_per_market_sample_vs_listed_approx():
    cov = coverage()
    by_market = {row["market"]: row for row in cov["markets"]}
    for market in Market:
        row = by_market[market.value]
        assert row["sample"] >= 8
        assert row["listed_approx"] > row["sample"]
    assert cov["sample_total"] == len(universe())
    assert "不是全市场覆盖" in cov["disclaimer"]
    assert "不构成投资建议" in cov["disclaimer"]


def test_ipo_pipeline_is_sample_not_ticker():
    deals = ipos()
    assert len(deals) >= 4
    markets = {deal.market for deal in deals}
    assert len(markets) >= 2
    assert any(deal.status in {"hearing", "filed", "passed", "subscribed", "priced"} for deal in deals)
    stellar = get_ipo("星辰先进")
    assert stellar.market == Market.A_SHARE
    try:
        get_stock("星辰先进")
        raise AssertionError("unlisted IPO must not resolve as a stock")
    except KeyError:
        pass
    try:
        get_ipo("火星矿业IPO")
        raise AssertionError("unknown IPO should miss")
    except KeyError:
        pass


def test_new_names_are_scorable():
    for symbol in ("000858.SZ", "601318.SS", "LLY", "TSLA", "00388.HK"):
        stock = get_stock(symbol)
        quality = score_quality(stock)
        valuation = score_valuation(stock)
        assert 0 <= quality.total <= 100
        assert 0 <= valuation.total <= 100


def test_snapshot_includes_coverage_and_ipos():
    payload = snapshot()
    assert payload["coverage"]["sample_total"] == len(payload["briefs"])
    assert len(payload["ipos"]) >= 4
    assert payload["coverage"]["industry_count"] == len(payload["industries"])


def test_cli_universe_prints_counts(capsys):
    assert main(["universe"]) == 0
    out = capsys.readouterr().out
    assert "样本" in out
    assert "约" in out
    assert "A" in out and "HK" in out and "US" in out
    assert "不构成投资建议" in out or "不是" in out


def test_cli_ipos(capsys):
    assert main(["ipos"]) == 0
    out = capsys.readouterr().out
    assert "星辰先进" in out
    assert "Helios" in out or "Helios Compute" in out
    assert "不构成投资建议" in out
    assert "样本" in out
