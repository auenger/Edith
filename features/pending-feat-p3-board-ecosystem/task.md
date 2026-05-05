# Tasks: feat-p3-board-ecosystem

## Task Breakdown

### 1. 类型定义
- [ ] board/server/types/governance.ts — GovernanceHealth / GovernanceConflict / VaultFileNode 类型
- [ ] board/server/types/index.ts 导出治理类型

### 2. Board API 扩展
- [ ] board/server/routes/governance.ts — 4 个 GET 端点
- [ ] GET /api/governance/health — 读取 .edith/governance/health.json
- [ ] GET /api/governance/lifecycle — 读取 lifecycle.json
- [ ] GET /api/governance/conflicts — 读取 conflicts.json
- [ ] GET /api/vault/tree — Vault 目录树 + 治理状态

### 3. DataReader 扩展
- [ ] data-reader.ts 新增治理缓存字段（governanceHealth / governanceLifecycle / governanceConflicts / vaultTree）
- [ ] 扫描 .edith/governance/ 目录
- [ ] invalidateCache 扩展治理数据刷新

### 4. FileWatcher + WebSocket 扩展
- [ ] file-watcher.ts 监听 .edith/governance/*.json
- [ ] WebSocket 新增 governance:update 事件
- [ ] 事件类型：lifecycle_change / conflict_detected / conflict_resolved / health_change

### 5. Dashboard 治理面板（Bento Grid）
- [ ] board/src/components/dashboard/GovernancePanel.tsx — 健康度主面板
- [ ] HealthScoreCard.tsx — 综合评分卡片
- [ ] StaleAlertCard.tsx — Stale 告警卡片
- [ ] PendingReviewCard.tsx — 待审阅卡片
- [ ] ConflictAlertCard.tsx — 冲突告警卡片
- [ ] LifecycleDistribution.tsx — 生命周期分布可视化
- [ ] StaleItemsList.tsx — Stale 项目列表
- [ ] GovernanceEvents.tsx — 最近治理事件时间线

### 6. Explorer Vault 视图
- [ ] board/src/components/explorer/VaultTab.tsx — Vault Tab 入口
- [ ] VaultTree.tsx — Vault 目录树组件（复用文件树模式）
- [ ] GovernanceStatusBadge.tsx — 治理状态标签（颜色编码）
- [ ] VaultFilePreview.tsx — 文件预览 + 治理元数据面板

### 7. 治理状态颜色编码
- [ ] 定义状态颜色映射：scaffold=blue, reviewed=green, mature=purple, stale=amber, conflict=red
- [ ] 全局样式变量（CSS variables）

### 8. 向后兼容
- [ ] 无 governance 数据时：面板显示"暂无数据"，不报错
- [ ] 无 Vault 目录时：Vault Tab 显示"尚未配置 Obsidian Vault"
- [ ] API 端点在数据缺失时返回空结构而非 404

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-05 | Feature created | Board 生态集成，依赖 governance-engine + board-redesign |
