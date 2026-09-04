# 跨市场研究看板

Next.js 16 + oRPC + shadcn/ui。数据来自仓库根目录的 Python 引擎，不在前端重算估值。

```bash
# 在仓库根目录
python3 -m quant json -o web/src/data/snapshot.json
cd web
npm install
npm run dev
```

- `/` 总览
- `/stocks` 个股宇宙与详情
- `/industries` 行业吸引力
- `/strategies` 四条研究策略
- `/reports` 研报审阅
- `/markets` A/港/美与港股通规则
- `/rpc` oRPC 只读接口

`npm run sync-data` 会重新导出快照。样本价格不是实时行情，不构成投资建议。

## Railway

根仓库同时有 Python 与 Next.js。请用本目录或仓库根的 `Dockerfile`，不要让 Railpack 在仓库根猜语言。服务需部署包含 `web/` 的分支，并监听 Railway 注入的 `PORT`。
