# Design

样本查找用 `ticker_candidates`（港股补位、A 股补 .SS/.SZ）。未命中则 `quote` 一次 Yahoo。测试不访问外网：只测候选代码与样本名称解析。
