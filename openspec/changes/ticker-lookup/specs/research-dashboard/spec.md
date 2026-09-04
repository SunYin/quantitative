## ADDED Requirements

### Requirement: Ticker search box

看板 SHALL 提供输入股票代码或名称的查询框。命中研究样本时 SHALL 打开该样本研究卡。未命中样本但公开行情可用时 SHALL 展示报价与 K 线，且 SHALL NOT 编造质量或估值分。

#### Scenario: Sample code

- **WHEN** 用户输入 `0700.HK` 或 `腾讯`
- **THEN** SHALL 打开腾讯样本研究卡

#### Scenario: Live-only name

- **WHEN** 用户输入不在样本池、但 Yahoo 可报价的代码
- **THEN** 页面 SHALL 标明不在样本池
- **AND** SHALL NOT 显示编造的综合/质量/估值研究分
- **AND** SHALL 声明不构成投资建议

#### Scenario: Unknown

- **WHEN** 用户输入无法解析的代码
- **THEN** SHALL 显示未找到，而不是空研究卡
