# Research Reports Specification

## Purpose

卖方/行业研报审阅把研报当成假设生成器：抽取逻辑句与数字，检查估值纪律、风险披露和独立性红旗。This capability scores sell-side notes so a target price is never treated as a decision.

## Requirements

### Requirement: Heuristic report score

系统 SHALL 从投资逻辑清晰度、证据质量、估值严谨度、风险披露、独立性、目标价纪律六个维度给研报打分。

#### Scenario: Promotional report is penalized

- **WHEN** 输入一篇首次覆盖、承销关系、营销话术且目标价隐含上行过高的研报
- **THEN** 其总分 SHALL 低于一篇有敏感性分析与真实风险情景的对照研报
- **AND** 结果 SHALL 包含独立性或营销红旗

#### Scenario: Initiation buy flag

- **WHEN** 研报为首次覆盖且评级为买入或增持
- **THEN** 结果 SHALL 提示检查是否在帮投行客户做市值管理

### Requirement: Claim extraction

系统 SHALL 从正文抽取类似投资逻辑、证据与风险的句子，以及数字/倍数。

#### Scenario: Extracts thesis-like sentences

- **WHEN** 正文包含“核心结论”或“投资逻辑”
- **THEN** 抽取结果 SHALL 至少包含一句逻辑句
- **AND** SHALL 抽到至少一个数字或百分数

### Requirement: Reading checklist

系统 SHALL 提供覆盖三地市场与港股通的研报阅读清单，强调先复述逻辑再看目标价。

#### Scenario: Checklist covers markets

- **WHEN** 读取标准清单
- **THEN** 文本 SHALL 同时提到港股通、10-K 与 A/H
- **AND** SHALL 要求把报告当成假设生成器
