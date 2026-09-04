# Design

Yahoo `chart` 已支持 `1m` / `5m` / `15m` / `1d` / `1wk`。看板按 range 选 interval：

| 按钮 | range | interval | 画法 | 样本回退 |
| 分时 | intraday | 1m | 折线 | 否 |
| 1日 | 1d | 5m | K 线 | 否 |
| 5日 | 5d | 15m | K 线 | 否 |
| 1月…1年 | 1m…1y | 1d | K 线 | 是 |
| 5年 | 5y | 1wk | K 线 | 是 |

现有 `1m` 仍是 **1 月**，不是 1 分钟。测试不访问外网：只测 range 表、分钟时间戳解析、短周期禁止样本回退。
