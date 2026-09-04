## MODIFIED Requirements

### Requirement: Industry and market reference

看板 SHALL 展示行业吸引力因子与 A/港/美及港股通规则对照，行业卡片 SHALL 显示成分股，并提供产业链入口。

#### Scenario: Industry cards

- **WHEN** 用户打开行业页
- **THEN** 页面 SHALL 列出白酒、动力电池、中资银行、互联网平台、全球半导体中的至少四个
- **AND** 每张卡片 SHALL 显示总分与周期位置
- **AND** 行业数 SHALL 多于五个
- **AND** 卡片 SHALL 能点进成分股

#### Scenario: Connect rules

- **WHEN** 用户打开市场规则页
- **THEN** 页面 SHALL 区分南向港股通与北向沪深股通
- **AND** SHALL 说明名单与额度不是全市场开放

## ADDED Requirements

### Requirement: Chain view on the dashboard

看板 SHALL 展示 AI 等样本产业链的上下游分层与个股，分数仍来自研究引擎。

#### Scenario: Open AI chain

- **WHEN** 用户打开 AI 产业链
- **THEN** 页面 SHALL 显示上游到下游的层
- **AND** SHALL 列出各层样本股票的综合或质量分
- **AND** SHALL 声明不构成投资建议
