# Tasks: feat-p3-board-ecosystem

## Task Breakdown

### 1. 类型定义
- [x] board/server/types/governance.ts — GovernanceHealth / GovernanceConflict / VaultFileNode 类型
- [x] board/server/types/index.ts 导出治理类型

### 2. Board API 扩展
- [x] board/server/routes/governance.ts — 4 个 GET 端点
- [x] GET /api/governance/health — 读取 .edith/governance/health.json
- [x] GET /api/governance/lifecycle — 读取 lifecycle.json
- [x] GET /api/governance/conflicts — 读取 conflicts.json
- [x] GET /api/vault/tree — Vault 目录树 + 治理状态

### 3. DataReader 扩展
- [x] data-reader.ts 新增治理缓存字段（governanceHealth / governanceLifecycle / governanceConflicts / vaultTree）
- [x] 扫描 .edith/governance/ 目录
- [x] invalidateCache 扩展治理数据刷新

### 4. FileWatcher + WebSocket 扩展
- [x] file-watcher.ts 监听 .edith/governance/*.json
- [x] WebSocket 新增 governance:update 事件
- [x] 事件类型：lifecycle_change / conflict_detected / conflict_resolved / health_change

### 5. Dashboard 治理面板（Bento Grid）
- [x] board/src/components/dashboard/GovernancePanel.tsx — 健康度主面板（包含评分卡片、生命周期分布、质量分解）
- [x] StaleItemsList.tsx — Stale + 冲突项目列表
- [x] GovernanceEvents.tsx — 最近治理事件面板（服务级生命周期统计）
- [x] Dashboard page.tsx 集成三个治理面板

### 6. Explorer Vault 视图
- [x] board/src/app/explorer/page.tsx — Explorer 页面（Artifacts + Vault 双 Tab）
- [x] VaultTree.tsx — Vault 目录树组件（带治理状态标签）
- [x] GovernanceStatusBadge.tsx — 治理状态标签（颜色编码）
- [x] VaultFilePreview.tsx — 文件预览 + 治理元数据面板

### 7. 治理状态颜色编码
- [x] 定义状态颜色映射：scaffold=blue, reviewed=green, mature=purple, stale=amber, conflict=red
- [x] 全局样式变量（CSS variables in globals.css）

### 8. 向后兼容
- [x] 无 governance 数据时：面板显示"暂无数据"，不报错
- [x] 无 Vault 目录时：Vault Tab 显示"尚未配置 Obsidian Vault"
- [x] API 端点在数据缺失时返回空结构而非 404

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-05 | Feature created | Board 生态集成，依赖 governance-engine + board-redesign |
| 2026-05-06 | Implementation complete | 8/8 tasks completed: types, API, DataReader, WS, Dashboard panels, Explorer Vault, color system, backward compat |
