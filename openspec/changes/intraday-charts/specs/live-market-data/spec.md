## ADDED Requirements

### Requirement: Short-interval history is optional

分时与分钟 K SHALL 与现价一样允许失败：接口不可用时页面仍显示研究卡，且 SHALL NOT 把失败当成空的质量分。测试 SHALL NOT 访问外网。

#### Scenario: Minute chart fetch fails

- **WHEN** Yahoo 分钟 chart 超时或未安装
- **THEN** 分时/1日区域 SHALL 为空态
- **AND** 质量与估值分 SHALL 仍来自样本研究卡（若该名字在样本池）
