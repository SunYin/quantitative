## ADDED Requirements

### Requirement: CLI emits Mermaid for chains

`python -m quant industry AI`（或其它产业链别名）SHALL 输出可复制的 Mermaid `flowchart` 代码块，分层与看板一致。

#### Scenario: Industry AI prints mermaid

- **WHEN** 用户执行 `python -m quant industry AI`
- **THEN** 输出 SHALL 包含 `flowchart`
- **AND** SHALL 包含上游与下游
