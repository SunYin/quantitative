# Scoring Specification

## Purpose

质量、估值、行业与技术代理打分把公司与行业压成 0–100 分和字母等级，供策略与记分卡使用。分数是研究辅助，不是买卖指令。This capability is the shared scoring language for A-share, Hong Kong, US, and Stock Connect research.

## Requirements

### Requirement: Quality score dimensions

系统 SHALL 从盈利能力、现金流转化、资产负债表、增长与稳定性、治理与财务质量五个加权维度计算质量分，并输出 0–100 的总分与字母等级。

#### Scenario: High-quality consumer franchise

- **WHEN** 输入一家高 ROE、高现金流转化、低关联交易的消费公司样本（如贵州茅台）
- **THEN** 质量总分 SHALL 不低于 75
- **AND** 等级 SHALL 为 A、B+ 或 B

#### Scenario: Banks use capital metrics

- **WHEN** 输入风格为金融的银行样本
- **THEN** 资产负债表维度 SHALL 使用不良率与核心一级资本，而不是工业公司的净负债/EBITDA

### Requirement: Valuation uses the right ruler

系统 SHALL 按行业与市场选择主估值尺子：金融股优先 PB（美股银行使用独立同行中位），能算出 PE 的非金融股使用相对 PE，并叠加现金流收益率与增长调整。

#### Scenario: Chinese bank versus US bank

- **WHEN** 同时给招商银行 A 股与摩根大通打估值分
- **THEN** 两家都 SHALL 使用 PB 相对同市场银行中位
- **AND** 不得用同一套中资银行 PB 中位去衡量美股银行

#### Scenario: Loss-making name

- **WHEN** 股票 TTM PE 为负
- **THEN** 估值结果 SHALL 给出“PE 无意义”类警示
- **AND** 不得把负 PE 当成便宜

### Requirement: Industry attractiveness

系统 SHALL 按需求增长、竞争结构、利润池、政策与监管、估值周期、颠覆与周期位置给行业打分。

#### Scenario: Rich valuation flags

- **WHEN** 行业估值分位不低于 80
- **THEN** 结果 SHALL 包含估值偏高警示

#### Scenario: Policy headwind flags

- **WHEN** 行业政策分不高于 35
- **THEN** 结果 SHALL 包含监管或产业政策逆风警示

### Requirement: Scores are bounded research outputs

系统 SHALL 把因子分与总分裁剪在 0–100，并提供文字理由；不得把分数表述为下单信号。

#### Scenario: Factor rationale present

- **WHEN** 完成任一质量或估值打分
- **THEN** 每个因子 SHALL 带有可读 rationale
- **AND** 总分 SHALL 落在 0 到 100（含）
