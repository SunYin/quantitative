## 1. Python JSON 导出

- [x] 1.1 增加记分卡 JSON 序列化（briefs / strategies / industries / reports / markets）
- [x] 1.2 CLI 增加 `quant json -o`，默认写出可供前端读取的路径
- [x] 1.3 测试：导出文件可解析，字段与宇宙规模一致

## 2. Next.js 看板骨架

- [x] 2.1 用最新 Next.js App Router + TypeScript + Tailwind 初始化 `web/`
- [x] 2.2 初始化 shadcn/ui，加入 card / table / badge / tabs / button 等
- [x] 2.3 安装 oRPC + Zod + TanStack Query，建立 `/rpc` 与类型化客户端

## 3. 查询与页面

- [x] 3.1 oRPC 只读过程：universe / stock / industry / strategy / report / market
- [x] 3.2 总览、个股、行业、策略、研报、市场规则页面，全程展示免责声明
- [x] 3.3 `npm run sync-data` 从 Python 刷新快照

## 4. 验证

- [x] 4.1 pytest 覆盖 JSON 导出
- [ ] 4.2 看板 dev server 可打开，关键页面能看到跨市场样本与策略
