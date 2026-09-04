from quant.markets import connect_status
from quant.sample_data import get_stock, universe
from quant.strategies import ah_premium, connect_flow, quality_value, run_all_strategies


def test_quality_value_ranks_universe():
    result = quality_value()
    assert len(result.rows) == len(universe())
    assert result.ranked()[0].score >= result.ranked()[-1].score


def test_ah_premium_finds_bank_and_battery():
    result = ah_premium()
    joined = " ".join(r.symbol for r in result.rows)
    assert "600036.SS" in joined
    assert "300750.SZ" in joined
    for row in result.rows:
        assert "ah_premium" in row.extras


def test_connect_flow_only_connect_names():
    result = connect_flow()
    assert result.rows
    assert all(r.symbol != "AAPL" for r in result.rows)


def test_tencent_is_southbound():
    status = connect_status(get_stock("00700.HK"))
    assert status["southbound_eligible"] is True
    assert "南向" in status["implication"]


def test_run_all_strategies_keys():
    bundle = run_all_strategies()
    assert set(bundle) == {"quality_value", "ah_premium", "industry_rotation", "connect_flow"}
