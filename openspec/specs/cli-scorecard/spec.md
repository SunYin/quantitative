# CLI Scorecard Specification

## Purpose

命令行入口把样本宇宙、个股、行业、研报和市场规则渲染成终端说明，以及自包含的 HTML / Markdown 记分卡。This capability is the operator interface for the sample research universe.

## Requirements

### Requirement: Demo scorecard export

系统 SHALL 提供 `demo` 命令，在指定目录写出 `scorecard.html` 与 `scorecard.md`，并声明样本数据不是实时行情、不构成投资建议。

#### Scenario: Write both artifacts

- **WHEN** 用户执行 `python -m quant demo -o <dir>`
- **THEN** `<dir>/scorecard.html` 与 `<dir>/scorecard.md` SHALL 存在
- **AND** 两份输出 SHALL 包含茅台、腾讯、苹果、港股通与研报等关键信息
- **AND** HTML SHALL 包含表格

### Requirement: Single-name research card

系统 SHALL 提供 `analyze <symbol>`，输出市场、综合分、质量/估值拆解、互联互通含义与研究仓位上限。

#### Scenario: Analyze a southbound name

- **WHEN** 用户分析 `00700.HK`
- **THEN** 输出 SHALL 包含腾讯
- **AND** SHALL 说明南向可买并提示跟踪港股通持股变化
- **AND** SHALL 给出不高于 15% 的研究仓位上限

### Requirement: Industry and report commands

系统 SHALL 提供行业吸引力与研报审阅命令，以及市场规则对照。

#### Scenario: Industry memo

- **WHEN** 用户执行 `python -m quant industry 动力电池`
- **THEN** 输出 SHALL 包含吸引力总分、周期位置与因子拆解

#### Scenario: Research review

- **WHEN** 用户审阅促销风格研报样本 `nvda-hype`
- **THEN** 输出 SHALL 列出红旗

### Requirement: Universe listing

系统 SHALL 列出样本股票代码、市场与行业，并列出可用研报样本 id。

#### Scenario: List universe

- **WHEN** 用户执行 `python -m quant universe`
- **THEN** 输出 SHALL 包含 A 股、港股与美股样本代码
- **AND** SHALL 列出研报样本标识

### Requirement: JSON snapshot export

系统 SHALL 提供 `json` 命令，把与 demo 记分卡相同的研究宇宙写成 JSON，供看板同步，且包含免责声明字段。

#### Scenario: Write snapshot file

- **WHEN** 用户执行 `python -m quant json -o <file>`
- **THEN** 文件 SHALL 存在且可被 JSON 解析
- **AND** 根对象 SHALL 包含 `disclaimer`、`briefs`、`strategies`、`industries`、`reports`

#### Scenario: Snapshot matches CLI universe

- **WHEN** 导出 JSON
- **THEN** `briefs` 数量 SHALL 等于样本宇宙规模
- **AND** 每条 brief SHALL 包含 `symbol`、`quality`、`valuation`、`composite`

### Requirement: Optional live JSON export

`json` 与 `analyze` SHALL 支持 `--live`：在可获取时用 Yahoo 覆盖价格与部分基本面再导出或展示；未安装依赖或网络失败时 SHALL 回退样本并退出码为 0。

#### Scenario: Live flag degrades

- **WHEN** 用户执行 `python -m quant json --live` 且 Yahoo 不可用
- **THEN** 仍写出完整 JSON
- **AND** 元数据 SHALL 记录未使用实时覆盖或覆盖失败

### Requirement: Industry command resolves chains

`industry` 命令 SHALL 接受行业名或产业链别名（如 AI）；输出 SHALL 包含吸引力或分层利润池说明，以及相关个股。

#### Scenario: Analyze AI chain from CLI

- **WHEN** 用户执行 `python -m quant industry AI`
- **THEN** 输出 SHALL 包含上游与下游
- **AND** SHALL 提到英伟达或半导体，以及至少一只应用或终端样本
