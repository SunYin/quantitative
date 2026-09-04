## ADDED Requirements

### Requirement: Historical bars degrade like quotes

历史日 K SHALL 与现价一样：Yahoo 失败时回退样本路径，退出码与页面仍可用。测试 SHALL NOT 访问外网。

#### Scenario: Chart fetch fails

- **WHEN** Yahoo chart 超时或未安装
- **THEN** 个股页仍显示样本路径 K 线
- **AND** 来源 SHALL 不是 Yahoo
