# 跨市场股票研究框架

面向 **A 股、港股、美股、港股通 / 沪深股通** 的研究操作系统：同一套质量语言，不同的估值与交易语言。用来做行业分析、个股记分卡和卖方研报审阅。

> 样本财务与价格是方法演示，不是实时行情，也不构成投资建议。

## 你能用它做什么

- 给茅台、招行 A/H、腾讯、美团、苹果、英伟达等样本打**质量 / 估值 / 综合分**
- 做**行业吸引力**（增长、集中度、利润池、政策、估值分位、颠覆）
- 计算 **A/H 溢价** 与南向/北向资金拥挤度
- 用清单和启发式给**研报**打分，抓逻辑句、数字和红旗
- 导出 HTML / Markdown 研究记分卡

## 快速开始

```bash
python3 -m pip install -e ".[dev]"
python3 -m quant universe
python3 -m quant markets
python3 -m quant analyze 00700.HK
python3 -m quant industry 动力电池
python3 -m quant research cmb-ah
python3 -m quant demo
```

`quant demo` 会在 `reports/scorecard.html` 生成完整记分卡。

## 研究层级

```
宏观与流动性
    ↓
行业利润池（谁能留下利润）
    ↓
公司质量与治理
    ↓
估值（先选对尺子）
    ↓
交易结构：港股通 / A/H / 仓位与证伪
```

详细说明：

| 文档 | 内容 |
| --- | --- |
| [docs/01-分析框架.md](docs/01-分析框架.md) | 自上而下 + 自下而上的总流程 |
| [docs/02-市场差异与港股通.md](docs/02-市场差异与港股通.md) | 三地微观结构、名单、额度、A/H |
| [docs/03-行业分析.md](docs/03-行业分析.md) | 产业链、利润池、跨市场对照 |
| [docs/04-研报阅读.md](docs/04-研报阅读.md) | 十分钟读法、红旗、档案 |
| [docs/05-策略手册.md](docs/05-策略手册.md) | 四条可计算策略 |

## 内置策略

1. **质量-价值**：三地通用，先质量后价格
2. **A/H 溢价**：解释两地价差，不当无风险套利
3. **行业轮动**：先给行业打分再选股
4. **互联互通资金**：南向/北向作为拥挤度

## 项目结构

```
src/quant/          分析引擎与 CLI
docs/               方法论文档
tests/              单元测试（不依赖行情网络）
reports/            demo 输出
openspec/           规格与变更（当前行为 + 进行中的改动）
.cursor/            Cursor 的 /opsx-* 命令与 skills
```

把 `sample_data.py` 换成你的数据源后，打分函数可原样复用。

## OpenSpec（先对齐再写代码）

本仓库用 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 做规格驱动开发。先写变更提案和可验证要求，再改代码。

```bash
npm install -g @fission-ai/openspec@latest   # Node 20.19+
openspec list --specs
openspec validate --all
```

在 Cursor 里：

| 命令 | 作用 |
| --- | --- |
| `/opsx-explore` | 先读代码、收敛模糊想法（不写文件） |
| `/opsx-propose <想法>` | 生成 proposal / specs / design / tasks |
| `/opsx-apply` | 按 tasks 实现 |
| `/opsx-archive` | 把 delta 合进 `openspec/specs/` 并归档 |

当前主规格（已实现行为）：

- `openspec/specs/scoring` — 质量 / 估值 / 行业打分
- `openspec/specs/strategies` — 质量-价值、A/H、行业轮动、互联互通
- `openspec/specs/research-reports` — 研报审阅与清单
- `openspec/specs/cli-scorecard` — CLI 与 HTML 记分卡

约定写在 `openspec/config.yaml`：制品用中文；标题和 SHALL/MUST 保持英文；样本价格不是实时行情，输出不是投资建议。
