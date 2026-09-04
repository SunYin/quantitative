from quant.industry import score_industry
from quant.research import extract_claims, reading_checklist, score_research
from quant.sample_data import REPORTS, get_industry


def test_battery_industry_not_failing():
    score = score_industry(get_industry("动力电池"))
    assert 40 <= score.total <= 90
    assert score.factors


def test_semiconductor_flags_rich_valuation():
    score = score_industry(get_industry("全球半导体"))
    assert any("估值" in flag for flag in score.flags)


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
