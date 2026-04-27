# Checklist: feat-tool-query

## Completion Checklist

### Layer 0 Loading
- [ ] routing-table.md 文件加载正确
- [ ] 文件不存在/空 → KNOWLEDGE_BASE_EMPTY 错误
- [ ] 解析为结构化数据（服务名、角色、技术栈）
- [ ] Layer 0 常驻缓存（不重复读取）

### Service Matching
- [ ] question 文本中服务名提取算法正确
- [ ] 中英文服务名匹配
- [ ] 别名映射支持
- [ ] services 参数显式指定时跳过自动提取
- [ ] 无匹配 → SERVICE_NOT_FOUND + 已有服务列表

### Layer 1 Loading
- [ ] quick-ref.md 文件加载正确
- [ ] 文件缺失 → MISSING_LAYER1 warning + 降级
- [ ] 文件损坏 → CORRUPTED_FILE warning + 跳过
- [ ] max_depth=0 时不加载 Layer 1

### Layer 2 Loading
- [ ] distillates/ 目录扫描正确
- [ ] 根据问题语义精准加载片段（非全量）
- [ ] 目录为空 → MISSING_LAYER2 warning + 降级
- [ ] max_depth<=1 时不加载 Layer 2

### Answer Quality
- [ ] 每个事实标注来源（layer + file + section）
- [ ] 引用格式清晰可读
- [ ] 多服务查询时 sources 包含所有相关服务
- [ ] tokensConsumed 统计准确

### Performance
- [ ] 50 服务知识库中仅加载目标服务文件
- [ ] tokensConsumed 不超过 routing-table + quick-ref + distillates 预算
- [ ] max_depth 限制生效（0/1/2）

### Degradation Strategy
- [ ] 缺 Layer 1 → 降级到 Layer 0 回答 + warning
- [ ] 缺 Layer 2 → 降级到 Layer 0+1 回答 + warning
- [ ] 文件损坏 → 跳过 + warning
- [ ] 所有降级情况用户都收到说明

### JARVIS Discipline
- [ ] 输出为纯 Markdown（无专有格式）
- [ ] Skills 不暴露给用户
- [ ] 只引用知识库中存在的事实
- [ ] 回答引用来源，不凭空编造
- [ ] 不修改知识库文件（只读操作）

### Testing
- [ ] Scenario 1-8 全部覆盖
- [ ] 降级路径有独立测试
- [ ] 性能测试：50 服务知识库
- [ ] 端到端测试：Agent → jarvis_query → 带引用回答

### Documentation
- [ ] spec.md 包含 QueryResult + SourceCitation 结构
- [ ] task.md Progress Log 已更新
