## ADDED Requirements

### Requirement: Optional live JSON export

`json` 与 `analyze` SHALL 支持 `--live`：在可获取时用 Yahoo 覆盖价格与部分基本面再导出或展示；未安装依赖或网络失败时 SHALL 回退样本并退出码为 0。

#### Scenario: Live flag degrades

- **WHEN** 用户执行 `python -m quant json --live` 且 Yahoo 不可用
- **THEN** 仍写出完整 JSON
- **AND** 元数据 SHALL 记录未使用实时覆盖或覆盖失败
