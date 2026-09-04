## ADDED Requirements

### Requirement: Market sample counts versus listed universe

系统 SHALL 按 A 股、港股、美股分别报告样本只数，并给出全市场上市约数。约数 SHALL 标明不是官方普查、不构成投资建议。样本只数 SHALL 小于约数。

#### Scenario: Coverage on universe listing

- **WHEN** 用户查看样本池或总览覆盖
- **THEN** SHALL 分别列出 A、HK、US 的样本只数
- **AND** 每个市场的样本 SHALL 不少于 8 只
- **AND** SHALL 出现全市场约数，且约数大于样本

#### Scenario: Not a full tape

- **WHEN** 展示覆盖
- **THEN** SHALL NOT 把样本只数写成已覆盖全部上市股票

### Requirement: IPO pipeline slice

系统 SHALL 提供跨市场 IPO/新股管道样本（申报、上会、过会、申购或已定价等），每条 SHALL 有市场、行业或可比公司，并声明不是交易所官方名单、不构成投资建议。

#### Scenario: List IPO pipeline

- **WHEN** 用户打开 IPO 列表或运行 `ipos`
- **THEN** 结果 SHALL 包含至少四个样本
- **AND** SHALL 覆盖不少于两个市场
- **AND** SHALL 声明样本或非投资建议

#### Scenario: IPO is not a scored listing

- **WHEN** 管道中的名字尚未有样本上市代码
- **THEN** 系统 SHALL NOT 把它当作可分析个股代码查询成功
