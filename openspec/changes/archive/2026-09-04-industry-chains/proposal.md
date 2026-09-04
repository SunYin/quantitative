## Why

行业吸引力目前只有 5 个切片，卡片上几乎看不到成分股；用户问「AI 上下游」时也无法按产业链分层。需要更多行业、每层挂个股，并能把「AI / 算力 / 新能源车」解析成上下游利润池，而不是再写一句前景广阔。样本与实时都不是投资建议。

## What Changes

- 扩展样本行业与成分股（覆盖现有个股缺口：消费电子、本地生活、美股银行，并补 AI / 新能源链条）
- 新增产业链对象：上游 / 中游 / 下游节点、瓶颈、利润留存说明
- CLI `industry AI` 与看板行业页能分析产业链并列出个股
- 行业详情页展示成分股研究分

## Capabilities

### New Capabilities

- `industry-chains`: 产业链解析、上下游分层、成分股归属

### Modified Capabilities

- `scoring`: 行业吸引力覆盖更多行业切片
- `cli-scorecard`: `industry` 命令可解析行业或产业链别名
- `research-dashboard`: 行业页含成分股与产业链

## Impact

- `IndustrySnapshot` 增加 aliases / constituents
- 样本宇宙增加少量跨市场股票以撑起链条
- 打分公式不改，只换数据和分层
