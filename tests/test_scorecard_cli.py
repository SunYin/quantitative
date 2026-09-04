from pathlib import Path

from quant.cli import main
from quant.scorecard import build_universe_scorecard, render_html, render_markdown, write_reports


def test_markdown_and_html_contain_markets():
    card = build_universe_scorecard()
    md = render_markdown(card)
    html = render_html(card)
    for token in ("贵州茅台", "腾讯", "苹果", "港股通", "研报"):
        assert token in md
        assert token in html
    assert "Apple" in html
    assert "<table>" in html


def test_write_reports(tmp_path: Path):
    paths = write_reports(tmp_path)
    assert paths["html"].exists()
    assert paths["markdown"].exists()
    assert "跨市场" in paths["html"].read_text(encoding="utf-8")


def test_cli_analyze(capsys):
    assert main(["analyze", "00700.HK"]) == 0
    out = capsys.readouterr().out
    assert "腾讯" in out
    assert "质量" in out


def test_cli_demo(tmp_path: Path, capsys):
    assert main(["demo", "-o", str(tmp_path)]) == 0
    assert (tmp_path / "scorecard.html").exists()
    assert "wrote" in capsys.readouterr().out


def test_cli_research(capsys):
    assert main(["research", "nvda-hype"]) == 0
    assert "红旗" in capsys.readouterr().out
