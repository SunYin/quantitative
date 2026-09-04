from quant.cli import main
from quant.sample_data import get_stock
from quant.ticker import ticker_candidates


def test_hk_and_a_share_aliases():
    assert "00700.HK" in ticker_candidates("0700.HK")
    assert "00700.HK" in ticker_candidates("700.HK")
    assert "600519.SS" in ticker_candidates("600519")
    assert get_stock("0700.HK").symbol == "00700.HK"
    assert get_stock("700.HK").name == "腾讯控股"
    assert get_stock("600519").symbol == "600519.SS"
    assert get_stock("腾讯").symbol == "00700.HK"
    assert get_stock("茅台").symbol == "600519.SS"


def test_unlisted_ipo_name_is_not_a_ticker():
    try:
        get_stock("星辰先进")
        raise AssertionError("unlisted IPO must not resolve as a stock")
    except KeyError:
        pass


def test_cli_analyze_aliases(capsys):
    assert main(["analyze", "0700.HK"]) == 0
    assert "腾讯" in capsys.readouterr().out
    assert main(["analyze", "600519"]) == 0
    assert "茅台" in capsys.readouterr().out
    assert main(["analyze", "腾讯"]) == 0
    out = capsys.readouterr().out
    assert "00700.HK" in out
    assert "腾讯" in out


def test_cli_analyze_unknown_is_not_a_scorecard(capsys):
    assert main(["analyze", "星辰先进"]) == 1
    err = capsys.readouterr().err
    assert "样本池" in err
    assert "不构成投资建议" in err
