import subprocess
from pathlib import Path

from quant.sample_data import get_stock


def test_intraday_does_not_change_sample_scores():
    stock = get_stock("00700.HK")
    assert stock.symbol == "00700.HK"
    assert stock.financials.roe > 0


def test_unlisted_ipo_still_cannot_open_intraday():
    try:
        get_stock("星辰先进")
        raise AssertionError("IPO name must not resolve as a stock for intraday")
    except KeyError:
        pass


def test_candle_range_contract_without_network():
    web = Path(__file__).resolve().parents[1] / "web"
    proc = subprocess.run(
        ["node", "--experimental-strip-types", "--test", "src/lib/candles.test.ts"],
        cwd=web,
        capture_output=True,
        text=True,
        check=False,
    )
    assert proc.returncode == 0, proc.stdout + proc.stderr
