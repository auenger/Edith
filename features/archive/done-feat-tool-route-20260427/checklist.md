# Checklist: feat-tool-route

## Completion Checklist

### Requirement Parsing
- [ ] requirement 参数必填校验
- [ ] context 参数正确解析
- [ ] 服务名提取算法覆盖中英文
- [ ] 别名映射支持
- [ ] 完全无法提取 → UNCLEAR_REQUIREMENT

### Routing Table Query
- [ ] routing-table.md 加载正确
- [ ] 文件不存在 → ROUTING_TABLE_NOT_FOUND
- [ ] 解析为结构化数据

### Change Type Classification
- [ ] crud / api_change / logic_change / schema_change / cross_service 分类准确
- [ ] 关键词映射表覆盖常见用语
- [ ] 混合类型有合理优先级

### Routing Decision Engine
- [ ] 0 个服务 → direct
- [ ] 1 服务 + CRUD → direct
- [ ] 1 服务 + 改接口 → quick-ref
- [ ] 1 服务 + schema_change → deep-dive
- [ ] 2+ 服务 → quick-ref (multi)
- [ ] 2+ 服务 + schema_change → deep-dive (multi)
- [ ] context 过滤：已加载文件不重复建议

### File Path Resolution
- [ ] quick-ref 路径生成正确
- [ ] distillates 碎片选择基于语义标签
- [ ] 文件存在性检查
- [ ] missing 文件在结果中标注

### Confidence & Ambiguity
- [ ] confidence 计算合理（服务匹配 + 改动类型确定性）
- [ ] confidence < 0.7 时填充 ambiguity 说明
- [ ] 歧义场景仍返回最佳猜测（不阻断）

### Result Structure
- [ ] RouteResult 包含所有必需字段
- [ ] reason 说明清晰可读
- [ ] filesToLoad 路径正确且可操作

### JARVIS Discipline
- [ ] 输出为纯 Markdown（无专有格式）
- [ ] Skills 不暴露给用户
- [ ] 只做建议，不执行加载
- [ ] 不修改知识库文件
- [ ] 不执行需求本身

### Testing
- [ ] Scenario 1-7 全部覆盖
- [ ] 路由决策表每种条件有独立测试
- [ ] 歧义场景有独立测试
- [ ] 端到端测试：Agent → jarvis_route → 决策建议

### Documentation
- [ ] spec.md 包含完整路由决策表和伪代码
- [ ] task.md Progress Log 已更新
