# Tasks: feat-tool-route

## Task Breakdown

### 1. Parameter Parsing (Scenario 1-7)
- [x] 定义 `RouteParams` 接口：`{ requirement: string; context?: string[] }`
- [x] 实现 requirement 参数必填校验
- [x] 实现 context 参数解析（已加载文件列表，用于避免重复建议）
- [x] 编写单元测试：合法参数、缺失 requirement、空字符串

### 2. Requirement Parsing — Service Extraction (Scenario 1-4, 6-7)
- [x] 实现 requirement 文本中服务名提取算法
- [x] 读取 routing-table.md 获取所有已知服务名列表
- [x] 支持中英文服务名匹配和别名
- [x] 多服务匹配且置信度低 → 记录 `AMBIGUOUS_SERVICE`（Scenario 4）
- [x] 完全无法提取 → 返回 `UNCLEAR_REQUIREMENT`（Scenario 6）
- [x] 编写单元测试：单服务提取、多服务提取、别名、歧义、无法提取

### 3. Change Type Classification (Scenario 1-3, 7)
- [x] 实现改动类型分类：`crud` / `api_change` / `logic_change` / `schema_change` / `cross_service`
- [x] 关键词映射：如 "加字段/加列/新增" → crud，"改接口/修改接口/变更" → api_change
- [x] "Schema/字段定义/数据模型" → schema_change（Scenario 7）
- [x] 跨服务关键词："同步/调用/集成/联动" → cross_service
- [x] 编写单元测试：各类型分类准确性、混合类型处理

### 4. Routing Table Query (Scenario 1-3, 5)
- [x] 实现 routing-table.md 文件加载
- [x] 文件不存在 → 返回 `ROUTING_TABLE_NOT_FOUND`（Scenario 5）
- [x] 解析为结构化数据：服务名、角色、技术栈、依赖关系
- [x] 编写单元测试：正常加载、文件缺失、多服务路由表

### 5. Routing Decision Engine (Scenario 1-3, 7)
- [x] 实现路由决策表（6 种条件 → 3 种决策）
- [x] 0 个已知服务 → `direct`
- [x] 1 服务 + CRUD → `direct`
- [x] 1 服务 + 改接口/改逻辑 → `quick-ref`
- [x] 1 服务 + schema_change → `deep-dive`
- [x] 2+ 服务 → `quick-ref` (multi)
- [x] 2+ 服务 + schema_change → `deep-dive` (multi)
- [x] 过滤 context 中已加载的文件（避免重复建议）
- [x] 编写单元测试：决策表每种条件至少一个用例

### 6. File Path Resolution
- [x] 根据决策 + 服务名 → 生成建议加载的文件路径列表
- [x] quick-ref 路径：`workspace/{service}/quick-ref.md`
- [x] distillates 路径：`workspace/{service}/distillates/{relevant-fragment}.md`
- [x] distillates 碎片选择：根据改动类型匹配语义标签
- [x] 验证建议的文件是否实际存在（不存在时标记为 missing）
- [x] 编写单元测试：路径生成、已存在/不存在文件处理

### 7. Result Assembly & Confidence Scoring (Scenario 4)
- [x] 组装 `RouteResult`：decision, services, filesToLoad, reason, confidence
- [x] 实现 confidence 计算：基于服务名匹配精确度和改动类型确定性
- [x] confidence < 0.7 → 填充 ambiguity 字段（Scenario 4）
- [x] 编写单元测试：高置信度、低置信度、歧义场景

### 8. Tool Registration (feat-extension-core integration)
- [x] 在 pi SDK Extension 中注册 jarvis_route 工具
- [x] 定义工具 schema：parameters + return type
- [x] 端到端测试：Agent 对话 → jarvis_route → 路由决策建议

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-27 | Spec enriched | Fixed missing Given preconditions, added OUT scope, 4 error scenarios, routing decision table, confidence scoring |
| 2026-04-27 | Implementation complete | All 8 tasks implemented: route.ts (500+ LOC), extension.ts updated, 31 unit tests passing |
