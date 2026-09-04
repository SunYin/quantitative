## Context

打分在 `src/quant`，看板在 Railway 的 Node 镜像里，没有 Python。因此 CLI 用 yfinance，看板用 yahoo-finance2，同一套 Yahoo 代码映射。

## Goals / Non-Goals

**Goals:**

- 现价、涨跌、PE/PB/股息/ROE 能接一点就接一点
- 失败回退样本
- 标明来源

**Non-Goals:**

- 完整财报重建、港股通持股官方接口、K 线交易系统
- 把打分公式搬到 TypeScript
- 保证 Yahoo 覆盖全部 A 股字段

## Decisions

1. **Yahoo 一条链路覆盖三地**：A 股 `.SS/.SZ`、港股 `0700.HK`、美股代码。港股通持仓仍用样本。
2. **Python `--live` 可重算记分卡**；看板默认只覆盖展示字段，不在 Node 里重算质量分。
3. **60 秒缓存**，避免每次导航打爆 Yahoo。
4. **页面改为动态渲染**（总览/个股），否则 SSG 只有样本。

## Risks / Trade-offs

- Yahoo 非官方、有限额，A 股基本面经常缺失。
- 实时 PE 与样本质量分可能不一致，必须在 UI 上写清楚。
