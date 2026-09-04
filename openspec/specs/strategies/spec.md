# Strategies Specification

## Purpose

四条研究策略把打分翻译成优先级：质量-价值、A/H 溢价、行业轮动、互联互通资金。输出是研究动作，不是交易指令。This capability ranks research priority across A-shares, Hong Kong, US, and Stock Connect.

## Requirements

### Requirement: Quality-value ranking

系统 SHALL 用 `0.45 × 质量 + 0.40 × 估值 + 0.15 × 技术代理` 对股票宇宙排序，并给出“重点研究 / 观察名单 / 质量不足 / 估值偏贵或中性”等动作。

#### Scenario: Ranks the sample universe

- **WHEN** 对内置样本宇宙运行质量-价值策略
- **THEN** 返回行数 SHALL 等于宇宙规模
- **AND** 排序后第一名分数 SHALL 不低于最后一名

#### Scenario: Quality gate

- **WHEN** 某股票质量分低于 45
- **THEN** 动作 SHALL 为质量不足，无论估值是否便宜

### Requirement: A/H premium is not risk-free arb

系统 SHALL 用研究汇率把 A 股价换成港币后计算相对 H 股溢价，并解释投资者结构；SHALL NOT 把价差描述为可锁定的无风险套利。

#### Scenario: Classic A premium

- **WHEN** A 股相对 H 股溢价不低于 35% 且质量合格
- **THEN** 动作 SHALL 提示关注 H 股相对折价

#### Scenario: Pair coverage

- **WHEN** 样本中存在招行与宁德时代的 A/H 配对
- **THEN** 策略结果 SHALL 同时包含这两对

### Requirement: Industry rotation is top-down

系统 SHALL 先给行业打分再建议超配研究 / 标配 / 低配，而不是先选故事再找行业。

#### Scenario: Score maps to action

- **WHEN** 行业吸引力不低于 70
- **THEN** 动作 SHALL 为超配研究
- **WHEN** 行业吸引力低于 55
- **THEN** 动作 SHALL 为低配或等待更好价格

### Requirement: Connect flow is crowding

系统 SHALL 把南向或北向约 20 日持股变化当作拥挤度，仅在与质量/估值同向时纳入跟踪。

#### Scenario: Ignores US-only names

- **WHEN** 运行互联互通资金策略
- **THEN** 结果 SHALL 不包含无港股通/沪深股通资金样本的美股代码（如 AAPL）

#### Scenario: Quality plus inflow

- **WHEN** 南向 20 日持股上升至少 1% 且质量分不低于 60
- **THEN** 动作 SHALL 为资金与质量同向、纳入跟踪
