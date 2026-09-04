## ADDED Requirements

### Requirement: Universe and IPO commands

`universe` SHALL 按市场打印样本只数与全市场约数。`ipos` SHALL 列出 IPO 管道样本并声明非投资建议。

#### Scenario: Universe counts

- **WHEN** 用户执行 `python -m quant universe`
- **THEN** 输出 SHALL 含 A、HK、US 样本计数
- **AND** SHALL 含约数或「约」字样

#### Scenario: IPO list

- **WHEN** 用户执行 `python -m quant ipos`
- **THEN** 输出 SHALL 列出多条管道
- **AND** SHALL 声明不构成投资建议或样本
