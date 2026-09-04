## Context

打分引擎已在 `src/quant`，静态 HTML 记分卡不能导航。用户指定 Next.js + oRPC + shadcn。OpenSpec 约定：前端复用 `quant` 结果，不重写公式。

## Goals / Non-Goals

**Goals:**

- 可导航的研究看板，覆盖宇宙、个股、行业、策略、研报、市场规则
- 类型安全的只读 API
- Python 仍是研究计算的唯一来源

**Non-Goals:**

- 实盘行情、下单、登录、多用户权限
- 把打分公式移植到 TypeScript
- 独立 FastAPI / 微服务
- 每次请求 fork Python 进程

## Decisions

1. **数据流：Python 快照 → oRPC → UI**
   - `python -m quant json` 生成 `web/src/data/snapshot.json`
   - Next.js oRPC 过程读取快照并切片
   - 备选否决：前端重算（违反规格）；每请求 subprocess（慢且难部署）；单独 Python HTTP 服务（运维过重）

2. **栈：Next.js App Router + oRPC Route Handler + shadcn + TanStack Query**
   - `/rpc` catch-all 暴露 router
   - 浏览器走 RPCLink；需要时可用 `createRouterClient` 做 SSR
   - shadcn 提供表格、卡片、徽章、Tabs，深色研究风

3. **目录：`web/` 而不是 monorepo workspace**
   - 仓库仍以 Python 研究引擎为主，前端是一个应用
   - 根 README 写明 `cd web && npm run dev`

4. **查询形状**
   - `universe.list` / `stock.get`
   - `industry.list` / `industry.get`
   - `strategy.list`
   - `report.list` / `report.get`
   - `market.list`
   - 输入用 Zod 校验

## Risks / Trade-offs

- 快照会过期：用 `npm run sync-data` 重新导出；样本数据本就不是实时盘。
- Node 与 Python 双工具链：文档写清两步安装。
- oRPC 包名演进快：锁定当前稳定/最新线，避免 beta 与稳定混用。
