## ADDED Requirements

### Requirement: CLI language flag

`python -m quant` SHALL 接受 `--lang zh-CN`、`--lang zh-Hant` 或 `--lang en`。缺省 SHALL 为简体。语言只影响展示，不影响打分输入。

#### Scenario: English industry chain

- **WHEN** 用户执行 `python -m quant industry AI --lang en`
- **THEN** 输出 SHALL 包含 upstream 与 downstream（或 Upstream / Downstream）
- **AND** SHALL 包含 NVIDIA 或 Apple 或 TSMC
- **AND** SHALL 声明 not investment advice 或同等英文

#### Scenario: Default CLI stays Simplified

- **WHEN** 用户执行 `python -m quant industry AI` 且未传 `--lang`
- **THEN** 输出 SHALL 包含「上游」与「下游」
- **AND** SHALL 声明不构成投资建议或不是投资建议
