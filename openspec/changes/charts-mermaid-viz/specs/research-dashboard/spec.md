## ADDED Requirements

### Requirement: Stock detail shows a candlestick chart

个股详情页 SHALL 展示开高低收 K 线与成交量。行情优先来自 Yahoo 历史日 K；失败时 SHALL 回退样本路径并标明「样本示意」。K 线 SHALL NOT 被用来在前端重算质量或估值分。页面 SHALL 声明不构成投资建议。

#### Scenario: Open a listed sample name

- **WHEN** 用户打开 `00700.HK` 或 `AAPL` 个股页
- **THEN** 页面 SHALL 出现 K 线区域（蜡烛与成交量）
- **AND** SHALL 标明 Yahoo 或样本来源
- **AND** SHALL 声明不构成投资建议

#### Scenario: Color convention follows the listing market

- **WHEN** 绘制 A 股或港股 K 线
- **THEN** 上涨蜡烛 SHALL 为红色、下跌为绿色
- **WHEN** 绘制美股 K 线
- **THEN** 上涨蜡烛 SHALL 为绿色、下跌为红色

### Requirement: Value chain Mermaid flowchart

产业链页与行业总览中的链条卡片 SHALL 用 Mermaid 流程图展示上游/中游/下游分层，而不是只显示纯文本箭头。流程图 SHALL 声明样本地图不是投资建议。

#### Scenario: Render AI chain

- **WHEN** 用户打开人工智能产业链
- **THEN** 页面 SHALL 渲染 flowchart
- **AND** 图中 SHALL 出现上游与下游（或对应英文）
