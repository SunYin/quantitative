"""Command-line entry point: quant demo|analyze|industry|research|markets."""

from __future__ import annotations

import argparse
import sys

from quant.markets import CONNECT_RULES, PROFILES
from quant.models import Market
from quant.research import reading_checklist
from quant.sample_data import REPORTS, STOCKS
from quant.export import write_snapshot
from quant.scorecard import describe_industry, describe_report, describe_stock, write_reports


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="quant",
        description="A 股 / 港股 / 美股 / 港股通 研究框架（样本数据演示）",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    demo = sub.add_parser("demo", help="生成全市场记分卡")
    demo.add_argument("-o", "--output", default="reports", help="输出目录")

    analyze = sub.add_parser("analyze", help="个股研究卡")
    analyze.add_argument("symbol", help="例如 00700.HK / 600519.SS / AAPL")

    industry = sub.add_parser("industry", help="行业吸引力")
    industry.add_argument("name", help="例如 白酒 / 互联网平台 / 动力电池")

    research = sub.add_parser("research", help="研报审阅")
    research.add_argument("report_id", nargs="?", default="cmb-ah", help="tencent-init | cmb-ah | nvda-hype")

    dump = sub.add_parser("json", help="导出研究快照 JSON（供看板使用）")
    dump.add_argument("-o", "--output", default="web/src/data/snapshot.json", help="输出文件")

    sub.add_parser("markets", help="三地市场规则对照")
    sub.add_parser("checklist", help="读研报清单")
    sub.add_parser("universe", help="列出样本股票")

    args = parser.parse_args(argv)

    if args.cmd == "demo":
        paths = write_reports(args.output)
        print(f"wrote {paths['html']}")
        print(f"wrote {paths['markdown']}")
        return 0
    if args.cmd == "analyze":
        print(describe_stock(args.symbol))
        return 0
    if args.cmd == "industry":
        print(describe_industry(args.name))
        return 0
    if args.cmd == "research":
        print(describe_report(args.report_id))
        return 0
    if args.cmd == "json":
        path = write_snapshot(args.output)
        print(f"wrote {path}")
        return 0
    if args.cmd == "markets":
        _print_markets()
        return 0
    if args.cmd == "checklist":
        print("# 研报阅读清单\n")
        for i, item in enumerate(reading_checklist(), 1):
            print(f"{i}. {item}")
        return 0
    if args.cmd == "universe":
        for symbol, stock in STOCKS.items():
            print(f"{symbol:12} {stock.market.value:3} {stock.name}  {stock.industry}")
        print("\n研报样本:", ", ".join(REPORTS))
        return 0
    parser.error(f"unknown command {args.cmd}")
    return 2


def _print_markets() -> None:
    for market in Market:
        p = PROFILES[market]
        print(f"# {market.value}")
        print(f"- 货币/结算：{p.currency} / {p.settlement}")
        print(f"- 涨跌停：{p.price_limit}")
        print(f"- 空头：{p.shorting}")
        print(f"- 主信息源：{p.primary_research}")
        print(f"- 关键资金：{p.key_flows}")
        print(f"- 估值习惯：{p.valuation_habit}")
        print(f"- 治理焦点：{'；'.join(p.governance_focus)}")
        print()
    print("# 互联互通")
    for key, value in CONNECT_RULES.items():
        print(f"- {key}: {value}")


if __name__ == "__main__":
    sys.exit(main())
