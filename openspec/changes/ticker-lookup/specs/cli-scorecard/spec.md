## ADDED Requirements

### Requirement: CLI accepts ticker aliases

`analyze` SHALL 接受港股补位与 A 股 6 位数字等别名，以及唯一的样本中文名。

#### Scenario: Analyze padded HK code

- **WHEN** 用户执行 `python -m quant analyze 0700.HK`
- **THEN** 输出 SHALL 包含腾讯
