# live-market-data Specification

## Purpose
从公开行情接口覆盖样本宇宙的现价和一部分基本面（PE/PB/股息/ROE），失败时保持样本数据可用，并标明来源。

## Requirements

### Requirement: Live quote overlay with fallback

系统 SHALL 尝试为样本股票获取近实时现价与涨跌；任一代码失败时 SHALL 保留该代码的样本价，不得让整个宇宙失败。

#### Scenario: Successful quote

- **WHEN** Yahoo 返回有效现价
- **THEN** 该股票 SHALL 暴露实时价格、涨跌幅与来源时间
- **AND** 来源 SHALL 标明 Yahoo

#### Scenario: Provider down

- **WHEN** 行情接口超时或不可用
- **THEN** 系统 SHALL 回退到样本数据
- **AND** SHALL 仍能列出完整宇宙

### Requirement: Partial fundamentals

系统 SHALL 在接口提供时覆盖 PE、PB、股息率和 ROE 中可得到的字段；缺失字段 SHALL 保持样本值。

#### Scenario: Mixed fields

- **WHEN** 某股票只有现价没有 PE
- **THEN** 价格 SHALL 用实时值，PE SHALL 保持样本或显示为空，不得虚构

### Requirement: Source labeling

对外展示 SHALL 同时说明：实时字段来自行情接口，研究分数默认仍基于样本财务，除非使用 live 重算。

#### Scenario: Dashboard disclaimer

- **WHEN** 用户打开总览或个股页
- **THEN** 页面 SHALL 区分实时报价与样本研究分数
