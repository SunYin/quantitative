from quant.cli import main
from quant.export import snapshot
from quant.i18n import remaining_cjk, set_locale, to_hant, translate, translate_tree
from quant.i18n_catalog import S2HK_FROM, S2HK_TO
from quant.scorecard import describe_industry


def test_s2hk_tables_align():
    assert len(S2HK_FROM) == len(S2HK_TO)


def test_hant_keeps_you_for_chain_roles():
    assert to_hant("上游") == "上游"
    assert to_hant("下游") == "下游"
    assert to_hant("中游") == "中游"
    assert "投資建議" in to_hant("不构成投资建议")
    assert "貴州茅台" in to_hant("贵州茅台")


def test_english_factors_and_disclaimer():
    set_locale("en")
    try:
        assert translate("盈利能力") == "Profitability"
        assert "not investment advice" in translate("样本数据仅供方法演示，不构成投资建议，也不是实时行情。").lower()
        assert translate("贵州茅台") == "Kweichow Moutai"
        assert translate("人工智能产业链") == "AI value chain"
    finally:
        set_locale("zh-CN")


def test_cli_industry_ai_english(capsys):
    assert main(["industry", "AI", "--lang", "en"]) == 0
    out = capsys.readouterr().out.lower()
    assert "upstream" in out
    assert "downstream" in out
    assert "nvidia" in out or "apple" in out or "tsmc" in out
    assert "not investment advice" in out
    set_locale("zh-CN")


def test_cli_industry_ai_hant(capsys):
    assert main(["industry", "AI", "--lang", "zh-Hant"]) == 0
    out = capsys.readouterr().out
    assert "上游" in out and "下游" in out
    assert "上遊" not in out
    assert "不構成投資建議" in out or "不是投資建議" in out
    set_locale("zh-CN")


def test_default_cli_stays_simplified(capsys):
    assert main(["industry", "AI"]) == 0
    out = capsys.readouterr().out
    assert "上游" in out and "下游" in out
    assert "不构成投资建议" in out or "不是投资建议" in out


def test_snapshot_includes_i18n_catalog():
    payload = snapshot()
    assert payload["i18n"]["default"] == "zh-CN"
    assert "en" in payload["i18n"]["locales"]
    assert payload["i18n"]["phrases"]["盈利能力"] == "Profitability"


def test_english_snapshot_has_limited_cjk():
    set_locale("en")
    try:
        localized = translate_tree(snapshot())
        leftover = remaining_cjk(str(localized["disclaimer"]) + str(localized["strategies"]))
        assert leftover == ""
        names = {row["name"] for row in localized["briefs"]}
        assert "Tencent" in names
        assert "Apple" in names
        chain_names = {row["name"] for row in localized["chains"]}
        assert "AI value chain" in chain_names
    finally:
        set_locale("zh-CN")


def test_live_disclaimer_translates_cleanly():
    set_locale("en")
    try:
        text = (
            "现价、涨跌及部分 PE/PB/股息/ROE 在可获取时来自 Yahoo Finance（约 60 秒缓存）；"
            "质量、估值与策略分仍基于研究样本财务，前端不重算打分。"
            "样本与实时数据均不构成投资建议。"
        )
        out = translate(text)
        assert remaining_cjk(out) == ""
        assert "not investment advice" in out.lower()
    finally:
        set_locale("zh-CN")


def test_describe_industry_respects_locale():
    set_locale("en")
    try:
        text = describe_industry("动力电池")
        assert "CATL" in text
        assert "Constituents" in text or "constituent" in text.lower()
    finally:
        set_locale("zh-CN")
