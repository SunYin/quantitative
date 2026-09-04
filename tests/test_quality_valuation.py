from quant.quality import score_quality
from quant.sample_data import get_stock
from quant.technical import position_cap
from quant.valuation import implied_upside, score_valuation


def test_moutai_is_high_quality():
    score = score_quality(get_stock("600519.SS"))
    assert score.total >= 75
    assert score.grade in {"A", "B+", "B"}


def test_nvda_quality_and_expensive_valuation():
    stock = get_stock("NVDA")
    quality = score_quality(stock)
    valuation = score_valuation(stock)
    assert quality.total >= 70
    assert valuation.total < quality.total


def test_bank_uses_capital_metrics():
    score = score_quality(get_stock("600036.SS"))
    names = {f.name for f in score.factors}
    assert "资产负债表" in names
    assert score.total > 50


def test_position_cap_is_bounded():
    stock = get_stock("AAPL")
    cap = position_cap(stock, quality=80, valuation=70)
    assert 0 < cap <= 0.15


def test_implied_upside_defined_for_pe_names():
    assert implied_upside(get_stock("00700.HK")) is not None
