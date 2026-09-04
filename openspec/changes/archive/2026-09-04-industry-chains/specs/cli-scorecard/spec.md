## ADDED Requirements

### Requirement: Industry command resolves chains

`industry` 命令 SHALL 接受行业名或产业链别名（如 AI）；输出 SHALL 包含吸引力或分层利润池说明，以及相关个股。

#### Scenario: Analyze AI chain from CLI

- **WHEN** 用户执行 `python -m quant industry AI`
- **THEN** 输出 SHALL 包含上游与下游
- **AND** SHALL 提到英伟达或半导体，以及至少一只应用或终端样本
