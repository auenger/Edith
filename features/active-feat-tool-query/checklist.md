# Checklist: feat-tool-query

## Completion Checklist

### Layer 0 Loading
- [x] routing-table.md 文件加载正确
- [x] 文件不存在/空 → KNOWLEDGE_BASE_EMPTY 错误
- [x] 解析为结构化数据（服务名、角色、技术栈）
- [x] Layer 0 常驻缓存（不重复读取）

### Service Matching
- [x] question 文本中服务名提取算法正确
- [x] 中英文服务名匹配
- [x] 别名映射支持
- [x] services 参数显式指定时跳过自动提取
- [x] 无匹配 → SERVICE_NOT_FOUND + 已有服务列表

### Layer 1 Loading
- [x] quick-ref.md 文件加载正确
- [x] 文件缺失 → MISSING_LAYER1 warning + 降级
- [x] 文件损坏 → CORRUPTED_FILE warning + 跳过
- [x] max_depth=0 时不加载 Layer 1

### Layer 2 Loading
- [x] distillates/ 目录扫描正确
- [x] 根据问题语义精准加载片段（非全量）
- [x] 目录为空 → MISSING_LAYER2 warning + 降级
- [x] max_depth<=1 时不加载 Layer 2

### Answer Quality
- [x] 每个事实标注来源（layer + file + section）
- [x] 引用格式清晰可读
- [x] 多服务查询时 sources 包含所有相关服务
- [x] tokensConsumed 统计准确

### Performance
- [x] 50 服务知识库中仅加载目标服务文件
- [x] tokensConsumed 不超过 routing-table + quick-ref + distillates 预算
- [x] max_depth 限制生效（0/1/2）

### Degradation Strategy
- [x] 缺 Layer 1 → 降级到 Layer 0 回答 + warning
- [x] 缺 Layer 2 → 降级到 Layer 0+1 回答 + warning
- [x] 文件损坏 → 跳过 + warning
- [x] 所有降级情况用户都收到说明

### JARVIS Discipline
- [x] 输出为纯 Markdown（无专有格式）
- [x] Skills 不暴露给用户
- [x] 只引用知识库中存在的事实
- [x] 回答引用来源，不凭空编造
- [x] 不修改知识库文件（只读操作）

### Testing
- [x] Scenario 1-8 全部覆盖
- [x] 降级路径有独立测试
- [x] 性能测试：50 服务知识库
- [x] 端到端测试：Agent → jarvis_query → 带引用回答

### Documentation
- [x] spec.md 包含 QueryResult + SourceCitation 结构
- [x] task.md Progress Log 已更新

## Verification Record

| Date | Status | Summary |
|------|--------|---------|
| 2026-04-27 | PASSED | All 8 tasks complete. 24/24 tests pass. TypeScript 0 errors. All 8 Gherkin scenarios verified. |

### Evidence
- `features/active-feat-tool-query/evidence/verification-report.md`
- `features/active-feat-tool-query/evidence/test-results.json`
