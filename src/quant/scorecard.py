"""Research scorecard rendering (Markdown + self-contained HTML)."""

from __future__ import annotations

from datetime import date
from html import escape
from pathlib import Path

from quant.i18n import html_lang, translate
from quant.industry import chain_layers, chain_memo, chain_mermaid, industry_memo, score_industry
from quant.research import extract_claims, reading_checklist, score_research
from quant.sample_data import REPORTS, chains, get_chain, get_industry, industries, industry_constituents, universe
from quant.strategies import StrategyResult, run_all_strategies, stock_brief


def build_universe_scorecard(*, disclaimer: str | None = None) -> dict:
    strategies = run_all_strategies()
    briefs = [stock_brief(s.symbol) for s in universe()]
    industry_rows = []
    for item in industries():
        scored = score_industry(item)
        industry_rows.append({"industry": item, "score": scored, "memo": industry_memo(item, scored)})
    reports = []
    for key, report in REPORTS.items():
        reports.append(
            {
                "id": key,
                "report": report,
                "score": score_research(report),
                "claims": extract_claims(report),
            }
        )
    return {
        "as_of": date.today().isoformat(),
        "disclaimer": disclaimer
        or "样本数据仅供方法演示，不构成投资建议，也不是实时行情。",
        "briefs": briefs,
        "strategies": strategies,
        "industries": industry_rows,
        "chains": [{"chain": item, "layers": chain_layers(item)} for item in chains()],
        "reports": reports,
        "checklist": reading_checklist(),
    }


def render_markdown(card: dict | None = None) -> str:
    card = card or build_universe_scorecard()
    lines = [
        "# 跨市场股票研究记分卡",
        "",
        f"- 日期：{card['as_of']}",
        f"- {card['disclaimer']}",
        "",
        "## 个股综合",
        "",
        "| 代码 | 名称 | 市场 | 综合 | 质量 | 估值 | 建议仓位上限 |",
        "| --- | --- | --- | ---: | ---: | ---: | ---: |",
    ]
    for brief in sorted(card["briefs"], key=lambda b: b["composite"], reverse=True):
        s = brief["stock"]
        lines.append(
            f"| {s.symbol} | {s.name} | {s.market.value} | {brief['composite']:.1f} | "
            f"{brief['quality'].total:.1f} | {brief['valuation'].total:.1f} | {brief['position_cap']:.1%} |"
        )
    for key, result in card["strategies"].items():
        lines += _strategy_md(result)
    lines += ["", "## 行业吸引力", ""]
    for row in card["industries"]:
        ind, scored = row["industry"], row["score"]
        lines.append(f"### {ind.name} — {scored.total:.1f} ({scored.grade})")
        lines.append(ind.notes)
        lines.append("")
    lines += ["", "## 研报审阅", ""]
    for row in card["reports"]:
        r, scored = row["report"], row["score"]
        lines.append(f"### {r.title}")
        lines.append(f"- 券商：{r.broker}  评级：{r.rating}  评分：{scored.total:.1f} ({scored.grade})")
        if scored.flags:
            lines.append("- 红旗：" + "；".join(scored.flags))
        lines.append("")
    lines += ["", "## 读研报清单", ""]
    lines.extend(f"- {item}" for item in card["checklist"])
    lines.append("")
    return translate("\n".join(lines))


def render_html(card: dict | None = None) -> str:
    card = card or build_universe_scorecard()
    rows = []
    for brief in sorted(card["briefs"], key=lambda b: b["composite"], reverse=True):
        s = brief["stock"]
        rows.append(
            "<tr>"
            f"<td>{escape(s.symbol)}</td><td>{escape(s.name)}<div class='sub'>{escape(s.name_en)}</div></td>"
            f"<td><span class='pill {s.market.value}'>{s.market.value}</span></td>"
            f"<td>{brief['composite']:.1f}</td><td>{brief['quality'].total:.1f}</td>"
            f"<td>{brief['valuation'].total:.1f}</td><td>{brief['position_cap']:.1%}</td>"
            f"<td>{escape(s.industry)}</td>"
            "</tr>"
        )
    strategy_html = "".join(_strategy_html(v) for v in card["strategies"].values())
    industry_html = []
    for row in card["industries"]:
        ind, scored = row["industry"], row["score"]
        bars = "".join(
            f"<div class='factor'><span>{escape(f.name)}</span>"
            f"<i style='width:{f.score:.0f}%'></i><b>{f.score:.0f}</b></div>"
            for f in scored.factors
        )
        industry_html.append(
            f"<article class='card'><h3>{escape(ind.name)} <small>{escape(ind.name_en)}</small> "
            f"<em>{scored.total:.1f} {scored.grade}</em></h3>"
            f"<p>{escape(ind.notes)}</p>{bars}</article>"
        )
    report_html = []
    for row in card["reports"]:
        r, scored = row["report"], row["score"]
        flags = "".join(f"<li>{escape(x)}</li>" for x in scored.flags) or "<li>无明显营销红旗</li>"
        report_html.append(
            f"<article class='card'><h3>{escape(r.title)}</h3>"
            f"<p class='sub'>{escape(r.broker)} · {r.rating} · {scored.total:.1f} ({scored.grade})</p>"
            f"<ul>{flags}</ul></article>"
        )
    checklist = "".join(f"<li>{escape(x)}</li>" for x in card["checklist"])
    html = f"""<!DOCTYPE html>
<html lang="{html_lang()}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>跨市场股票研究记分卡</title>
  <style>
    :root {{
      --bg:#0f1419; --card:#18202a; --line:#2a3644; --text:#e8eef4; --muted:#93a4b5;
      --accent:#3dd6c6; --a:#f5c16c; --hk:#7aa2ff; --us:#ff8b7a; --ah:#c39bff;
    }}
    * {{ box-sizing:border-box; }}
    body {{ margin:0; font-family:"Iowan Old Style", "Source Han Serif SC", "Songti SC", serif;
           background:radial-gradient(1200px 600px at 10% -10%, #1c2a36, var(--bg)); color:var(--text); }}
    main {{ max-width:1180px; margin:0 auto; padding:32px 20px 64px; }}
    h1,h2,h3 {{ font-weight:600; letter-spacing:.02em; }}
    h1 {{ font-size:2rem; margin:0 0 8px; }}
    h2 {{ margin-top:40px; border-bottom:1px solid var(--line); padding-bottom:8px; }}
    .lead {{ color:var(--muted); max-width:70ch; }}
    table {{ width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--line); }}
    th,td {{ text-align:left; padding:10px 12px; border-bottom:1px solid var(--line); font-size:14px; }}
    th {{ color:var(--muted); font-weight:500; }}
    .sub {{ color:var(--muted); font-size:12px; }}
    .pill {{ padding:2px 8px; border-radius:999px; font-size:12px; }}
    .pill.A {{ background:#5a4418; color:var(--a); }}
    .pill.HK {{ background:#1d2d55; color:var(--hk); }}
    .pill.US {{ background:#4a221c; color:var(--us); }}
    .grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; }}
    .card {{ background:var(--card); border:1px solid var(--line); padding:16px 18px; }}
    .factor {{ display:grid; grid-template-columns:110px 1fr 36px; gap:8px; align-items:center; margin:6px 0; font-size:13px; color:var(--muted); }}
    .factor i {{ display:block; height:6px; background:linear-gradient(90deg,var(--accent),#7aa2ff); }}
    em {{ color:var(--accent); font-style:normal; }}
    footer {{ color:var(--muted); margin-top:48px; font-size:13px; }}
  </style>
</head>
<body>
<main>
  <h1>跨市场股票研究记分卡</h1>
  <p class="lead">{escape(card['disclaimer'])} 生成日期 {escape(card['as_of'])}。</p>
  <h2>个股综合（样本池）</h2>
  <table>
    <thead><tr><th>代码</th><th>名称</th><th>市场</th><th>综合</th><th>质量</th><th>估值</th><th>仓位上限</th><th>行业</th></tr></thead>
    <tbody>{''.join(rows)}</tbody>
  </table>
  {strategy_html}
  <h2>行业吸引力</h2>
  <div class="grid">{''.join(industry_html)}</div>
  <h2>研报审阅</h2>
  <div class="grid">{''.join(report_html)}</div>
  <h2>读研报清单</h2>
  <ol>{checklist}</ol>
  <footer>框架覆盖 A 股、港股、美股与港股通/沪深股通。质量、估值、行业、研报四层分开打分，避免把卖方结论直接当成决策。</footer>
</main>
</body>
</html>
"""
    return translate(html)


def write_reports(output_dir: str | Path = "reports", *, disclaimer: str | None = None) -> dict[str, Path]:
    directory = Path(output_dir)
    directory.mkdir(parents=True, exist_ok=True)
    card = build_universe_scorecard(disclaimer=disclaimer)
    md_path = directory / "scorecard.md"
    html_path = directory / "scorecard.html"
    md_path.write_text(render_markdown(card), encoding="utf-8")
    html_path.write_text(render_html(card), encoding="utf-8")
    return {"markdown": md_path, "html": html_path}


def _strategy_md(result: StrategyResult) -> list[str]:
    lines = ["", f"## 策略：{result.name}", "", result.objective, "",
             "| 标的 | 市场 | 分数 | 动作 | 理由 |", "| --- | --- | ---: | --- | --- |"]
    for row in result.ranked():
        lines.append(f"| {row.symbol} | {row.market} | {row.score:.1f} | {row.action} | {row.reason} |")
    return lines


def _strategy_html(result: StrategyResult) -> str:
    body = []
    for row in result.ranked():
        body.append(
            "<tr>"
            f"<td>{escape(row.symbol)}</td><td>{escape(row.market)}</td>"
            f"<td>{row.score:.1f}</td><td>{escape(row.action)}</td>"
            f"<td>{escape(row.reason)}</td></tr>"
        )
    notes = "".join(f"<li>{escape(n)}</li>" for n in result.notes)
    return (
        f"<h2>策略：{escape(result.name)}</h2>"
        f"<p class='lead'>{escape(result.objective)}</p>"
        "<table><thead><tr><th>标的</th><th>市场</th><th>分数</th><th>动作</th><th>理由</th></tr></thead>"
        f"<tbody>{''.join(body)}</tbody></table>"
        f"<ul>{notes}</ul>"
    )


def describe_stock(symbol: str) -> str:
    from quant.live import active_quotes, field_sources

    brief = stock_brief(symbol)
    stock = brief["stock"]
    quote = active_quotes().get(stock.symbol)
    sources = field_sources(quote)
    source_line = "；".join(
        f"{_field_zh(name)} {('Yahoo' if src == 'yahoo' else '样本')}" for name, src in sources.items()
    )
    lines = [
        f"# {stock.name} ({stock.symbol})",
        f"- 市场：{stock.market.value} / {stock.board} / {stock.currency}",
        f"- 行业：{stock.industry} | {stock.gics_industry or stock.shenwan_industry}",
        f"- 现价：{stock.price} {stock.currency}  PE {stock.pe_ttm if stock.pe_ttm is not None else '—'}  "
        f"PB {stock.pb if stock.pb is not None else '—'}  股息 {stock.dividend_yield:.1%}  "
        f"ROE {stock.financials.roe:.1%}",
        f"- 字段来源：{source_line}",
        f"- 综合：{brief['composite']}  质量 {brief['quality'].total} ({brief['quality'].grade})  "
        f"估值 {brief['valuation'].total} ({brief['valuation'].grade})",
        f"- 互联互通：{brief['connect']['implication']}",
        f"- 建议研究仓位上限：{brief['position_cap']:.1%}",
        "",
        "## 质量拆解",
    ]
    for factor in brief["quality"].factors:
        lines.append(f"- {factor.name} {factor.score:.1f}：{factor.rationale}")
    lines += ["", "## 估值拆解"]
    for factor in brief["valuation"].factors:
        lines.append(f"- {factor.name} {factor.score:.1f}：{factor.rationale}")
    if stock.notes:
        lines += ["", f"> {stock.notes}"]
    return translate("\n".join(lines) + "\n")


def _field_zh(name: str) -> str:
    return {
        "price": "现价",
        "change_pct": "涨跌",
        "pe_ttm": "PE",
        "pb": "PB",
        "dividend_yield": "股息",
        "roe": "ROE",
    }.get(name, name)


def describe_industry(name: str) -> str:
    try:
        chain = get_chain(name)
    except KeyError:
        chain = None
    if chain is not None:
        layers = chain_layers(chain)
        lines = [chain_memo(chain, layers), "## 各层个股", ""]
        for layer in layers:
            lines.append(f"### {layer['role_zh']} · {layer['industry'].name}")
            for stock in layer["stocks"]:
                brief = stock_brief(stock.symbol)
                lines.append(
                    f"- {stock.name} ({stock.symbol}) 综合 {brief['composite']:.1f} / "
                    f"质量 {brief['quality'].total:.1f} / 估值 {brief['valuation'].total:.1f}"
                )
            lines.append("")
        from quant.i18n import current_locale

        mermaid = chain_mermaid(chain, english=current_locale() == "en")
        lines += ["```mermaid", mermaid, "```", "", "样本与分层都不是投资建议。"]
        return translate("\n".join(lines) + "\n")

    item = get_industry(name)
    scored = score_industry(item)
    lines = [industry_memo(item, scored), "## 因子", ""]
    for factor in scored.factors:
        lines.append(f"- {factor.name} {factor.score:.1f}：{factor.rationale}")
    members = industry_constituents(item)
    if members:
        lines += ["", "## 成分股", ""]
        for stock in members:
            brief = stock_brief(stock.symbol)
            lines.append(
                f"- {stock.name} ({stock.symbol}) 综合 {brief['composite']:.1f} / "
                f"质量 {brief['quality'].total:.1f} / 估值 {brief['valuation'].total:.1f}"
            )
    if scored.flags:
        lines += ["", "## 警示", ""]
        lines.extend(f"- {flag}" for flag in scored.flags)
    return translate("\n".join(lines) + "\n")


def describe_report(report_id: str) -> str:
    if report_id not in REPORTS:
        raise KeyError(report_id)
    report = REPORTS[report_id]
    scored = score_research(report)
    claims = extract_claims(report)
    lines = [
        f"# {report.title}",
        f"- {report.broker} / {report.rating} / 目标价 {report.target_price} vs 现价 {report.current_price}",
        f"- 研报质量：{scored.total:.1f} ({scored.grade})",
        "",
        "## 清单提醒",
    ]
    lines.extend(f"- {x}" for x in reading_checklist()[:5])
    lines += ["", "## 抽取的逻辑句"]
    lines.extend(f"- {s}" for s in claims["thesis_like"] or ["（未抽到明确逻辑句）"])
    if scored.flags:
        lines += ["", "## 红旗"]
        lines.extend(f"- {x}" for x in scored.flags)
    return translate("\n".join(lines) + "\n")


__all__ = [
    "build_universe_scorecard",
    "describe_industry",
    "describe_report",
    "describe_stock",
    "render_html",
    "render_markdown",
    "write_reports",
]
