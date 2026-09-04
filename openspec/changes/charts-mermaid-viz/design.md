# Design

## K 线

`yahoo-finance2.chart` 拉日 K。缓存约 60 秒。测试用静态 quotes fixture + 样本随机路径生成器，不访问外网。

## Mermaid

`quant.industry.chain_mermaid` 生成 flowchart；看板客户端 mermaid 渲染。节点可点进行业页。语言随界面切换时由分层数据重画，不把中文硬编码进 SVG。
