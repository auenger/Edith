# Tasks: feat-p2-graphify-index

## Task Breakdown

### 1. 配置模型扩展
- [ ] 在 `agent/src/config.ts` 新增 `GraphifyConfig` 接口
- [ ] 更新 `IngestionConfig` 添加 graphify 字段
- [ ] 更新 edith.yaml 校验，确保向后兼容

### 2. Graphify 集成
- [ ] 注册 Graphify 为 EDITH 全局工具
- [ ] 实现 Graphify 索引扫描入口
- [ ] 配置 tree-sitter 语言支持（13+ 语言 + Markdown）
- [ ] 实现 graph.json 输出和缓存

### 3. graph.json → EDITH 产物映射
- [ ] graph.json 全局拓扑 → routing-table.md 自动生成
- [ ] 实体提取 + 社区聚类 → quick-ref.md 概念索引
- [ ] AST 调用图 + 依赖树 → distillates 片段骨架拆分
- [ ] 置信度分级标注（EXTRACTED / INFERRED / AMBIGUOUS）

### 4. 增量更新机制
- [ ] 文件变更检测（触发局部重扫）
- [ ] graph.json 增量更新（只更新变更部分）
- [ ] MarkItDown 新文件自动摄入

### 5. edith_scan 对接
- [ ] edith_scan 优先使用 Graphify 索引进行定向扫描
- [ ] 禁用 Graphify 时回退到全量文件扫描
- [ ] 混合模式：Graphify 标记高价值区域 + 全量扫描补充

### 6. 集成测试
- [ ] graph.json 生成准确性验证
- [ ] routing-table 自动生成验证
- [ ] 增量更新正确性验证
- [ ] 禁用回退测试

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 初始拆分 |
