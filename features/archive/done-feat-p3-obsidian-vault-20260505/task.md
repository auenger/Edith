# Tasks: feat-p3-obsidian-vault

## Task Breakdown

### 1. 配置层
- [x] config.ts 新增 ObsidianConfig 接口
- [x] edith.yaml 默认配置添加 obsidian 块
- [x] validateConfig 扩展 obsidian 字段校验

### 2. Vault 结构生成器
- [x] 实现 vault-structure.ts — 目录结构映射逻辑
- [x] 00-routing / 01-services / 02-distillates / 03-decisions / graphify-out 目录创建
- [x] .obsidian/ 配置生成（app.json, appearance.json）

### 3. Wikilinks 引擎
- [x] 实现 wikilinks.ts — 交叉引用生成
- [x] routing-table → 各服务 quick-ref 链接
- [x] quick-ref → 相关 distillate 链接
- [x] distillates → 关联服务和决策链接

### 4. Frontmatter 注入
- [x] 实现 frontmatter.ts — YAML frontmatter 生成与解析
- [x] 元数据字段：edith_id, layer, token_budget, token_actual, last_distilled, human_edited, confidence, related

### 5. 人工编辑检测
- [x] 实现 edit-detector.ts — content hash 计算 + 变更检测
- [x] distill --refresh 时检测人工修改并保留
- [x] human_edited 标记管理

### 6. 集成
- [x] obsidian.ts 主入口工具（generate / refresh / status 三个操作）
- [x] distill 集成：Vault 输出路径（通过 obsidian.ts 独立调用）
- [x] 与 graphify-out/ 目录对齐

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-05 | Feature created | 基于架构文档规划 |
| 2026-05-05 | Implementation complete | 5 个新文件 + config.ts 修改 |
