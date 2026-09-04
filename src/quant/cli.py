"""Command-line entry point: quant demo|analyze|industry|research|markets."""

from __future__ import annotations

import argparse
import sys

from quant.export import write_snapshot
from quant.i18n import set_locale, translate
from quant.live import disclaimer_for, live_session
from quant.markets import CONNECT_RULES, PROFILES
from quant.models import Market
from quant.research import reading_checklist
from quant.sample_data import (
    IPO_DISCLAIMER,
    REPORTS,
    STOCKS,
    coverage,
    ipos,
)
from quant.scorecard import describe_industry, describe_report, describe_stock, write_reports


def _add_lang(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--lang",
        default="zh-CN",
        help="Display language: zh-CN, zh-Hant, or en",
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="quant",
        description="A 股 / 港股 / 美股 / 港股通 研究框架（样本数据演示）",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    demo = sub.add_parser("demo", help="生成全市场记分卡")
    demo.add_argument("-o", "--output", default="reports", help="输出目录")
    demo.add_argument("--live", action="store_true", help="用 Yahoo 覆盖现价和部分基本面后重算")
    _add_lang(demo)

    analyze = sub.add_parser("analyze", help="个股研究卡")
    analyze.add_argument("symbol", help="例如 0700.HK / 600519 / 腾讯 / AAPL")
    analyze.add_argument("--live", action="store_true", help="用 Yahoo 覆盖现价和部分基本面后展示")
    _add_lang(analyze)

    industry = sub.add_parser("industry", help="行业吸引力")
    industry.add_argument("name", help="例如 白酒 / 动力电池 / AI / 人工智能")
    _add_lang(industry)

    research = sub.add_parser("research", help="研报审阅")
    research.add_argument("report_id", nargs="?", default="cmb-ah", help="tencent-init | cmb-ah | nvda-hype")
    _add_lang(research)

    dump = sub.add_parser("json", help="导出研究快照 JSON（供看板使用）")
    dump.add_argument("-o", "--output", default="web/src/data/snapshot.json", help="输出文件")
    dump.add_argument("--live", action="store_true", help="用 Yahoo 覆盖现价和部分基本面后导出")
    _add_lang(dump)

    markets = sub.add_parser("markets", help="三地市场规则对照")
    _add_lang(markets)
    checklist = sub.add_parser("checklist", help="读研报清单")
    _add_lang(checklist)
    universe = sub.add_parser("universe", help="列出样本股票与分市场覆盖")
    _add_lang(universe)
    ipo_cmd = sub.add_parser("ipos", help="列出 IPO / 新股管道样本")
    _add_lang(ipo_cmd)

    args = parser.parse_args(argv)
    set_locale(getattr(args, "lang", "zh-CN"))

    if args.cmd == "demo":
        with live_session(bool(getattr(args, "live", False))) as live:
            paths = write_reports(args.output, disclaimer=disclaimer_for(live))
            print(translate(f"wrote {paths['html']}"))
            print(translate(f"wrote {paths['markdown']}"))
            _print_live(live)
        return 0
    if args.cmd == "analyze":
        try:
            with live_session(bool(getattr(args, "live", False))) as live:
                print(describe_stock(args.symbol))
                _print_live(live)
        except KeyError:
            print(
                translate(
                    f"样本池没有 {args.symbol}。CLI 只给样本打分，不编造质量/估值。看板可输入代码看 Yahoo 行情。不构成投资建议。"
                ),
                file=sys.stderr,
            )
            return 1
        return 0
    if args.cmd == "industry":
        print(describe_industry(args.name))
        return 0
    if args.cmd == "research":
        print(describe_report(args.report_id))
        return 0
    if args.cmd == "json":
        with live_session(bool(getattr(args, "live", False))) as live:
            path = write_snapshot(args.output, live=live)
            print(translate(f"wrote {path}"))
            _print_live(live)
        return 0
    if args.cmd == "markets":
        _print_markets()
        return 0
    if args.cmd == "checklist":
        print(translate("# 研报阅读清单\n"))
        for i, item in enumerate(reading_checklist(), 1):
            print(f"{i}. {translate(item)}")
        return 0
    if args.cmd == "universe":
        _print_coverage()
        for symbol, stock in STOCKS.items():
            name = translate(stock.name)
            industry_name = translate(stock.industry)
            print(f"{symbol:12} {stock.market.value:3} {name}  {industry_name}")
        print("\n" + translate("研报样本:") + " " + ", ".join(REPORTS))
        return 0
    if args.cmd == "ipos":
        _print_ipos()
        return 0
    parser.error(f"unknown command {args.cmd}")
    return 2


IPO_STATUS_LABEL = {
    "hearing": "上会",
    "filed": "已申报",
    "passed": "过会",
    "subscribed": "申购",
    "priced": "已定价",
    "listed": "已上市",
    "postponed": "暂缓",
}


def _print_coverage() -> None:
    cov = coverage()
    print(translate("# 覆盖（样本 vs 全市场约数）"))
    print(translate(cov["disclaimer"]))
    for row in cov["markets"]:
        print(
            f"{row['market']:3}  {translate('样本')} {row['sample']} / {translate('约上市')} {row['listed_approx']}"
        )
    print(
        f"{translate('合计'):3}  {translate('样本')} {cov['sample_total']} / {translate('约上市')} {cov['listed_approx_total']}"
    )
    print()


def _print_ipos() -> None:
    print(translate("# IPO / 新股管道（研究样本）"))
    print(translate(IPO_DISCLAIMER))
    print()
    for deal in ipos():
        status = translate(IPO_STATUS_LABEL.get(deal.status, deal.status))
        name = translate(deal.name)
        industry_name = translate(deal.industry)
        print(
            f"{deal.id:16} {deal.market.value:3} {status:8} {deal.expected_date}  {name}  {industry_name}"
        )
    print()
    print(translate("未上市名字不能当已有代码去打分。不构成投资建议。"))


def _print_markets() -> None:
    for market in Market:
        p = PROFILES[market]
        print(translate(f"# {market.value}"))
        print(translate(f"- 货币/结算：{p.currency} / {p.settlement}"))
        print(translate(f"- 涨跌停：{p.price_limit}"))
        print(translate(f"- 空头：{p.shorting}"))
        print(translate(f"- 主信息源：{p.primary_research}"))
        print(translate(f"- 关键资金：{p.key_flows}"))
        print(translate(f"- 估值习惯：{p.valuation_habit}"))
        print(translate(f"- 治理焦点：{'；'.join(p.governance_focus)}"))
        print()
    print(translate("# 互联互通"))
    for key, value in CONNECT_RULES.items():
        print(f"- {key}: {translate(value)}")


def _print_live(live) -> None:
    if not live.enabled:
        return
    if live.fallback or live.applied == 0:
        print(translate("live: Yahoo 不可用，已回退样本"), file=sys.stderr)
        return
    print(
        translate(
            f"live: Yahoo 覆盖 {live.applied}/{live.applied + len(live.failed)} 只；失败 {len(live.failed)} 只仍用样本"
        ),
        file=sys.stderr,
    )


if __name__ == "__main__":
    sys.exit(main())
