## ADDED Requirements

### Requirement: AI chain includes memory and optics

人工智能产业链 SHALL 包含存储（DRAM/HBM 或接口）与光电/光模块层，且 SHALL NOT 把未上市的长芯/长鑫存储解析成可打分代码。查询「光电」SHALL 落到光模块或 AI 链。每层样本个股 SHALL 多于一只（对照切片除外）。样本地图 SHALL 声明不是投资建议。

#### Scenario: Memory and optics sit on the AI chain

- **WHEN** 用户查询 `AI` 或 `人工智能`
- **THEN** 分层 SHALL 出现存储芯片与光模块（或光电）
- **AND** 存储层 SHALL 挂上已上市样本个股
- **AND** 光模块层 SHALL 挂上已上市样本个股

#### Scenario: CXMT is not a ticker

- **WHEN** 用户把 `长芯存储` 或 `长鑫存储` 当股票代码查询
- **THEN** SHALL 不能得到研究分
- **AND** IPO 管道 SHALL 能解释这是未上市样本

#### Scenario: Optics query

- **WHEN** 用户查询 `光电`
- **THEN** SHALL 解析为光模块行业或人工智能产业链，而不是未知主题
