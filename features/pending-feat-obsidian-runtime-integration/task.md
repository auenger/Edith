# Tasks: feat-obsidian-runtime-integration

## Task Breakdown

### 1. Extension 工具注册
- [ ] 在 `agent/src/extension.ts` 的 tools 数组中注册 `edith_obsidian` 工具
  - 导入 `executeObsidian` from `./tools/obsidian.js`
  - 定义 parameter schema（action + services?）
  - 实现 execute handler（调用 executeObsidian，格式化输出）

### 2. 配置激活
- [ ] 在 `agent/edith.yaml` 末尾添加 `obsidian:` 配置段
  - enabled: true
  - vault_path: ./obsidian-vault
  - wikilinks / graph_view / frontmatter / human_edit_detection 全部 true

### 3. System Prompt 更新
- [ ] 在 `agent/src/system-prompt.ts` 中注入 Obsidian 工具能力描述
  - 当 config.obsidian.enabled 为 true 时添加工具说明
  - 包含支持的 3 个 action 和使用场景

### 4. 验证
- [ ] TypeScript 编译通过（`npm run build`）
- [ ] 已有测试通过

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-06 | Feature created | 待开发 |
