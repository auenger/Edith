# Tasks: feat-tool-query

## Task Breakdown

### 1. Parameter Parsing (Scenario 1, 2, 8)
- [ ] 定义 `QueryParams` 接口：`{ question: string; services?: string[]; max_depth?: 0|1|2 }`
- [ ] 实现 question 参数必填校验
- [ ] 实现 services 参数可选（为空时自动从问题中提取服务名）
- [ ] 实现 max_depth 参数校验（仅接受 0/1/2）
- [ ] 编写单元测试：合法参数、缺失 question、无效 max_depth

### 2. Layer 0 Loading — routing-table.md (Scenario 1, 2, 3, 7)
- [ ] 实现 routing-table.md 文件加载
- [ ] 文件不存在或为空 → 返回 `KNOWLEDGE_BASE_EMPTY`（Scenario 3）
- [ ] 解析 routing-table.md 为结构化数据（服务名列表、角色、技术栈）
- [ ] 实现 question → 服务名匹配算法（关键词匹配 + 别名映射）
- [ ] 无匹配 → 返回 `SERVICE_NOT_FOUND` + 已有服务列表（Scenario 8）
- [ ] 编写单元测试：正常加载、文件缺失、空文件、多服务匹配

### 3. Service Name Extraction (Scenario 2, 8)
- [ ] 实现 question 文本中服务名提取
- [ ] 支持中英文服务名匹配（如 "用户服务" → "user-service"）
- [ ] 支持别名映射（从 routing-table.md 中读取）
- [ ] 支持 services 参数显式指定时跳过自动提取
- [ ] 编写单元测试：单服务、多服务、别名、显式指定

### 4. Layer 1 Loading — quick-ref.md (Scenario 1, 4, 6)
- [ ] 实现 quick-ref.md 文件加载
- [ ] 文件不存在 → 记录 `MISSING_LAYER1` warning，降级到 Layer 0（Scenario 4）
- [ ] 文件损坏 → 记录 `CORRUPTED_FILE` warning，跳过该文件（Scenario 6）
- [ ] 从 quick-ref.md 提取关键信息：验证命令、约束、端点概要
- [ ] 编写单元测试：正常加载、文件缺失、文件损坏

### 5. Layer 2 Loading — distillates/*.md (Scenario 1, 5)
- [ ] 实现 distillates/ 目录扫描
- [ ] 根据问题语义选择加载哪些片段（非全量加载）
- [ ] 目录为空或缺失 → 记录 `MISSING_LAYER2` warning（Scenario 5）
- [ ] 单片段 token 计数，控制加载量
- [ ] 编写单元测试：精准加载、目录为空、片段选择准确性

### 6. Answer Assembly with Citations (Scenario 1, 2)
- [ ] 定义 `QueryResult` 接口：answer, sources, layersLoaded, tokensConsumed
- [ ] 实现来源引用组装：每个事实标注来源 layer + file + section
- [ ] 实现 token 消耗统计
- [ ] 实现 answer 中的引用格式：`[来源: Layer 1 quick-ref.md § 验证命令]`
- [ ] 编写单元测试：引用格式、多来源、token 统计准确性

### 7. Performance Optimization (Scenario 7)
- [ ] 确保 Layer 0 常驻加载（只读一次，缓存）
- [ ] 确保 Layer 1/2 仅加载匹配服务的文件（不加载无关服务）
- [ ] 实现 max_depth 限制：depth=0 不加载 Layer 1/2
- [ ] 编写性能测试：50 服务知识库中仅加载目标服务相关文件

### 8. Tool Registration (feat-extension-core integration)
- [ ] 在 pi SDK Extension 中注册 jarvis_query 工具
- [ ] 定义工具 schema：parameters + return type
- [ ] 端到端测试：Agent 对话 → jarvis_query → 带引用的回答

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-27 | Spec enriched | Added OUT scope, 5 error scenarios, performance scenario, citation structure |
