# research-dashboard Specification

## Purpose
跨市场研究看板用类型安全的查询接口展示 Python 引擎的记分卡，覆盖个股、行业、策略、研报和市场规则，并始终声明非投资建议。

## Requirements

### Requirement: Dashboard surfaces the research universe

看板 SHALL 在总览页展示样本宇宙的综合分、质量、估值与研究仓位上限，并同时覆盖 A 股、港股与美股样本。

#### Scenario: Overview lists cross-market names

- **WHEN** 用户打开看板总览
- **THEN** 页面 SHALL 显示贵州茅台、腾讯与苹果（或对应英文名）
- **AND** SHALL 显示综合分、质量分与估值分

#### Scenario: Disclaimer is visible

- **WHEN** 用户打开任一看板页面
- **THEN** 页面 SHALL 声明不构成投资建议
- **AND** SHALL 区分实时报价（若获取成功）与研究分数来源

### Requirement: Typed read APIs for research slices

系统 SHALL 通过 oRPC 提供只读查询：股票列表与详情、行业列表、策略结果、研报审阅、市场规则。查询结果 SHALL 来自 Python 记分卡快照，而不是前端重算估值。

#### Scenario: Stock detail query

- **WHEN** 客户端查询代码 `00700.HK`
- **THEN** 接口 SHALL 返回腾讯的质量拆解、估值拆解与南向可买含义
- **AND** SHALL 包含研究仓位上限

#### Scenario: Unknown symbol

- **WHEN** 客户端查询不存在的代码
- **THEN** 接口 SHALL 返回可识别的未找到错误，而不是空对象冒充成功

### Requirement: Strategy and report views

看板 SHALL 展示质量-价值、A/H 溢价、行业轮动、互联互通四条策略，以及研报评分与红旗。

#### Scenario: A/H premium is explained

- **WHEN** 用户打开策略页的 A/H 溢价
- **THEN** 页面 SHALL 显示招行或宁德时代配对的溢价
- **AND** SHALL NOT 把价差写成无风险套利

#### Scenario: Promotional report flags

- **WHEN** 用户打开促销风格研报样本
- **THEN** 页面 SHALL 显示红旗与低于对照研报的质量分

### Requirement: Industry and market reference

看板 SHALL 展示行业吸引力因子与 A/港/美及港股通规则对照。

#### Scenario: Industry cards

- **WHEN** 用户打开行业页
- **THEN** 页面 SHALL 列出白酒、动力电池、中资银行、互联网平台、全球半导体中的至少四个
- **AND** 每张卡片 SHALL 显示总分与周期位置

#### Scenario: Connect rules

- **WHEN** 用户打开市场规则页
- **THEN** 页面 SHALL 区分南向港股通与北向沪深股通
- **AND** SHALL 说明名单与额度不是全市场开放

### Requirement: Live fields on stock views

总览与个股页 SHALL 显示实时现价/涨跌（若获取成功），并保留质量与估值研究分。

#### Scenario: Live price on overview

- **WHEN** Yahoo 报价成功
- **THEN** 股票表 SHALL 出现实时价格或涨跌
- **AND** 综合/质量/估值分仍来自研究引擎

#### Scenario: Fallback still renders

- **WHEN** 实时接口失败
- **THEN** 页面 SHALL 仍显示样本宇宙与免责声明
