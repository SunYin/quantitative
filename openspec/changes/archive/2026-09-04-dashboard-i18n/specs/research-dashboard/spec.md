## ADDED Requirements

### Requirement: Dashboard language switch

看板 SHALL 支持简体中文、繁体中文与英文。用户 SHALL 能在不改 URL 结构的前提下切换语言，选择 SHALL 在后续请求中保持。每种语言的页面 SHALL 声明不构成投资建议。

#### Scenario: Switch to English

- **WHEN** 用户将语言设为英文
- **THEN** 导航与表头 SHALL 为英文
- **AND** 个股 SHALL 优先显示英文名（如 Tencent、Apple）
- **AND** 免责声明 SHALL 含 not investment advice 或同等英文

#### Scenario: Traditional Chinese for Hong Kong

- **WHEN** 用户将语言设为繁体，或 `Accept-Language` 为 zh-HK 且无已存选择
- **THEN** 界面 SHALL 使用繁体
- **AND** 「上游」SHALL NOT 被写成「上遊」
- **AND** 免责声明 SHALL 含「不構成投資建議」

#### Scenario: Default remains Simplified

- **WHEN** 用户未选择语言且 `Accept-Language` 不是英文或繁体中文
- **THEN** 界面 SHALL 使用简体中文
- **AND** SHALL 声明不构成投资建议
