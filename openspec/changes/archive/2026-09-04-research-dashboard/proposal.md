## Why

研究框架已经有 Python 打分、策略和静态 HTML 记分卡，但缺少可导航的看板：个股、行业、策略、研报和市场规则散落在 CLI 输出里。需要一个现代前端，让同一套结果可以点选、对比和审阅。

样本价格不是实时行情，看板文案必须继续声明不构成投资建议。

## What Changes

- 新增 Next.js 研究看板（App Router + oRPC + shadcn/ui + TanStack Query）
- Python 增加 JSON 导出，作为看板的唯一研究数据源
- oRPC 提供只读查询：宇宙、个股、行业、策略、研报、市场规则
- 看板页面覆盖总览、个股、行业、策略、研报、三地/港股通规则
- CLI `quant json` 写出快照，供前端同步

## Capabilities

### New Capabilities

- `research-dashboard`: 跨市场研究看板的页面、查询与免责声明行为

### Modified Capabilities

- `cli-scorecard`: 增加 JSON 导出命令，供看板消费

## Impact

- 新增 `web/` Next.js 应用与 Node 依赖
- `src/quant` 增加 JSON 序列化，不改打分公式
- README 增加看板启动方式
- 不影响现有质量/估值计算口径
