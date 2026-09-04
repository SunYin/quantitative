## ADDED Requirements

### Requirement: JSON snapshot export

系统 SHALL 提供 `json` 命令，把与 demo 记分卡相同的研究宇宙写成 JSON，供看板同步，且包含免责声明字段。

#### Scenario: Write snapshot file

- **WHEN** 用户执行 `python -m quant json -o <file>`
- **THEN** 文件 SHALL 存在且可被 JSON 解析
- **AND** 根对象 SHALL 包含 `disclaimer`、`briefs`、`strategies`、`industries`、`reports`

#### Scenario: Snapshot matches CLI universe

- **WHEN** 导出 JSON
- **THEN** `briefs` 数量 SHALL 等于样本宇宙规模
- **AND** 每条 brief SHALL 包含 `symbol`、`quality`、`valuation`、`composite`
