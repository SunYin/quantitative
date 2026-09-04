from quant.cli import main
from quant.industry import chain_layers, score_industry
from quant.sample_data import chains, get_chain, get_industry, industries, industry_constituents
from quant.research import extract_claims, reading_checklist, score_research
from quant.sample_data import REPORTS


def test_battery_industry_not_failing():
    score = score_industry(get_industry("动力电池"))
    assert 40 <= score.total <= 90
    assert score.factors
    names = {s.symbol for s in industry_constituents(get_industry("动力电池"))}
    assert "300750.SZ" in names


def test_semiconductor_flags_rich_valuation():
    score = score_industry(get_industry("全球半导体"))
    assert any("估值" in flag for flag in score.flags)


def test_more_industries_cover_orphans():
    names = {item.name for item in industries()}
    assert len(names) >= 16
    assert "消费电子" in names
    assert "本地生活" in names
    assert "创新药" in names
    assert "保险" in names
    apple = {s.symbol for s in industry_constituents(get_industry("消费电子"))}
    meituan = {s.symbol for s in industry_constituents(get_industry("本地生活"))}
    assert "AAPL" in apple
    assert "03690.HK" in meituan


def test_ai_chain_has_up_and_downstream():
    chain = get_chain("AI")
    layers = chain_layers(chain)
    roles = {layer["role"] for layer in layers}
    assert "upstream" in roles
    assert "downstream" in roles
    names = {stock.name for layer in layers for stock in layer["stocks"]}
    assert "英伟达" in names
    assert "苹果" in names or "美团" in names
    memo_roles = " ".join(layer["role_zh"] for layer in layers)
    assert "上游" in memo_roles and "下游" in memo_roles


def test_unknown_topic_fails():
    try:
        get_industry("火星矿业")
        raise AssertionError("should miss")
    except KeyError:
        pass
    try:
        get_chain("火星矿业")
        raise AssertionError("should miss")
    except KeyError:
        pass


def test_cli_industry_ai(capsys):
    assert main(["industry", "AI"]) == 0
    out = capsys.readouterr().out
    assert "上游" in out and "下游" in out
    assert "flowchart" in out
    assert "英伟达" in out
    assert "不构成投资建议" in out or "不是投资建议" in out


def test_cli_industry_battery_lists_stock(capsys):
    assert main(["industry", "动力电池"]) == 0
    out = capsys.readouterr().out
    assert "宁德时代" in out


def test_hype_report_is_penalized():
    good = score_research(REPORTS["cmb-ah"])
    bad = score_research(REPORTS["nvda-hype"])
    assert good.total > bad.total
    assert bad.flags


def test_extracts_thesis_sentences():
    claims = extract_claims(REPORTS["cmb-ah"])
    assert claims["thesis_like"]
    assert claims["numbers"]


def test_checklist_covers_markets():
    text = "\n".join(reading_checklist())
    assert "港股通" in text
    assert "10-K" in text
    assert "A/H" in text


def test_sample_has_ai_chain():
    ids = {chain.id for chain in chains()}
    assert "ai" in ids
