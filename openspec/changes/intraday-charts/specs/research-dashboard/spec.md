## ADDED Requirements

### Requirement: Intraday and one-day charts

个股图 SHALL 提供分时（约 1 分钟折线）与 1 日图（约 5 分钟 K），以及 5 日短周期。这些周期 SHALL 使用公开延迟行情，SHALL NOT 用样本路径伪造盘中分时。K 线与分时 SHALL NOT 用于前端重算质量或估值分。页面 SHALL 声明不构成投资建议。

#### Scenario: Open intraday

- **WHEN** 用户在个股页选择分时
- **THEN** SHALL 请求分钟级公开行情并画折线（非日 K 蜡烛）
- **AND** Yahoo 不可用时 SHALL 显示空态，而不是样本分时

#### Scenario: Open one-day bars

- **WHEN** 用户选择 1 日
- **THEN** SHALL 展示该会话的分钟级 K 线（非单根日 K）

#### Scenario: Daily ranges still exist

- **WHEN** 用户选择 1 月 / 3 月 / 6 月 / 1 年
- **THEN** SHALL 仍展示日 K
- **AND** Yahoo 日 K 失败时样本路径回退仍然允许
