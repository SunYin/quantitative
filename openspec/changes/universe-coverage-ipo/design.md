# Design

## 覆盖口径

`coverage` 由样本 `STOCKS` 计数 + 手写 `listed_approx`（A≈5400，港≈2600，美≈4800）。约数是研究提示，不是官方普查。

## IPO

`IPODeal` 独立于 `Stock`。状态：hearing/filed/passed/subscribed/priced/listed/postponed。已上市若有样本代码可链到个股，否则只当日历。

## 数据

新增股票仍是手写样本，Yahoo 只覆盖报价。测试不访问外网。
