## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Live fields on stock views

总览与个股页 SHALL 显示实时现价/涨跌（若获取成功），并保留质量与估值研究分。

#### Scenario: Live price on overview

- **WHEN** Yahoo 报价成功
- **THEN** 股票表 SHALL 出现实时价格或涨跌
- **AND** 综合/质量/估值分仍来自研究引擎

#### Scenario: Fallback still renders

- **WHEN** 实时接口失败
- **THEN** 页面 SHALL 仍显示样本宇宙与免责声明
