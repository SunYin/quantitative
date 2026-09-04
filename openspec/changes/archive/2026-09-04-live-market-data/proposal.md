## Why

当前宇宙、分数和看板都来自 `sample_data.py` 静态样本。需要同时接一点现价/涨跌和一点 PE、PB、股息、ROE，否则研究台无法对照真实市场。接口失败时必须仍能用样本，不能让 CLI 或看板空白。

样本与实时都不是投资建议。

## What Changes

- Python 增加 Yahoo Finance 适配：覆盖价格与部分基本面，可选后重算记分卡
- 看板在请求时拉取 Yahoo 报价并标注来源；失败回退快照
- CLI `json` / `analyze` 支持 `--live`
- 页面区分「实时」与「样本」

## Capabilities

### New Capabilities

- `live-market-data`: 实时报价与部分基本面覆盖，以及失败回退

### Modified Capabilities

- `cli-scorecard`: JSON/分析命令可选用实时覆盖
- `research-dashboard`: 展示实时字段与数据来源

## Impact

- 可选依赖 `yfinance`；看板依赖 `yahoo-finance2`
- 打分公式不改，只替换 Stock 上的价格/部分倍率
- 网络失败不影响样本路径
