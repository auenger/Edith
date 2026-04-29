# Tasks: feat-knowledge-index-skill

## Task Breakdown

### 1. 知识库解析引擎
- [x] 实现 routing-table.md 解析（提取服务地图）
- [x] 实现 quick-ref.md 解析（提取验证命令、约束、API 端点、易错点）
- [x] 实现 distillates/*.md 解析（提取片段主题和内容摘要）
- [x] 实现 cross-references 解析（提取跨文档/跨服务关系）

### 2. 索引生成器
- [x] 设计索引 Skill 的 Markdown 模板（含 YAML frontmatter）
- [x] 实现单知识库索引生成
- [x] 实现多知识库交叉索引生成
- [x] 实现查询路由模式自动生成（基于片段主题分析）
- [x] Token 预算控制（索引文件 < 5000 tokens）

### 3. edith_index 工具实现
- [x] 创建 `agent/src/tools/index.ts`
- [x] 工具参数设计（target / output_path / services）
- [x] 调用知识库解析引擎 + 索引生成器
- [x] 错误处理（目录不存在、缺少必要文件）

### 4. 工具注册
- [x] 在 `agent/src/extension.ts` 中注册 `edith_index` 工具
- [x] 添加工具描述和参数 schema

### 5. edith_query 增强
- [x] 检测索引 Skill 文件是否存在
- [x] 利用索引的查询路由模式优化 Layer 2 片段加载
- [x] 减少无索引时的全量扫描

### 6. 验证
- [x] 使用 company-edith（LiteMes + DoNetMes）生成索引
- [ ] 在 Claude Code 中加载索引 Skill 并验证可用性
- [ ] 对比有/无索引时 edith_query 的 token 消耗

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 初始任务拆解 |
| 2026-04-29 | Implementation complete | 6 个任务组全部实现，TypeScript 编译通过 |
| 2026-04-29 | E2E test passed | company-edith 双服务索引生成成功：2 服务、9 片段、688 tokens |
