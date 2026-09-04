# industry-chains Specification

## Purpose
TBD - created by archiving change industry-chains. Update Purpose after archive.

## Requirements

### Requirement: Industry slices include constituents

每个行业切片 SHALL 列出样本成分股；成分股 SHALL 能映射回该行业。覆盖的行业数 SHALL 多于五个，并至少覆盖白酒、动力电池、银行、互联网、半导体、消费电子或本地生活中的缺口。

#### Scenario: Industry has names

- **WHEN** 查询动力电池
- **THEN** 结果 SHALL 包含宁德时代样本代码
- **AND** SHALL 给出行业吸引力总分

#### Scenario: Orphan stock industries are covered

- **WHEN** 列出全部行业
- **THEN** SHALL 存在消费电子或苹果所属行业切片
- **AND** SHALL 存在本地生活或美团所属行业切片

### Requirement: Value chain query

系统 SHALL 把 AI / 人工智能 / 算力 等查询解析为上下游产业链，而不是只返回单一行业分数。

#### Scenario: AI upstream downstream

- **WHEN** 用户查询 `AI` 或 `人工智能`
- **THEN** 结果 SHALL 区分上游（算力/芯片或代工）、中游（云或平台）、下游（终端或应用）
- **AND** 每层 SHALL 挂上样本个股
- **AND** SHALL 说明利润主要留在哪一层，不得把应用层写成和 GPU 同一利润池

#### Scenario: Unknown topic

- **WHEN** 查询不存在的行业或链条
- **THEN** 系统 SHALL 报未知主题，而不是编造产业链
