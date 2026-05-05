# Tasks: feat-p3-governance-engine

## Task Breakdown

### 1. 配置层
- [ ] config.ts 新增 GovernanceConfig 接口（enabled, stale_threshold, conflict_policy, quality_scoring）
- [ ] edith.yaml 默认配置添加 governance 块
- [ ] validateConfig 扩展 governance 字段校验

### 2. 知识生命周期状态机
- [ ] 实现 lifecycle.ts — 状态定义 + 转换规则
- [ ] scaffold → reviewed（人工确认）
- [ ] reviewed → mature（真实回写）
- [ ] reviewed/mature → stale（source_hash 不匹配）
- [ ] stale → scaffold（重新蒸馏）

### 3. Frontmatter 字段扩展
- [ ] 扩展 frontmatter.ts — 新增 lifecycle / governance / quality 字段块
- [ ] 解析已有 frontmatter 时向后兼容（旧文件无治理字段不报错）
- [ ] 状态转换时自动更新 frontmatter

### 4. 新鲜度检测（复用 edit-detector.ts）
- [ ] 实现 freshness-detector.ts — source_hash 对比
- [ ] edith distill --refresh 时检测过时片段
- [ ] stale_threshold 配置支持

### 5. 矛盾检测引擎（复用 edit-detector.ts）
- [ ] 实现 conflict-detector.ts — diff overlap 检测
- [ ] 新蒸馏内容 vs human_edited 区域重叠判断
- [ ] 冲突报告生成
- [ ] conflict_policy 配置支持（preserve_human / overwrite / notify）

### 6. 知识健康度评分
- [ ] 实现 health-scorer.ts — 四维评分模型
- [ ] freshness: 基于 last_distilled 时间差
- [ ] confidence: 基于 GraphifyConfidence（复用 graphify.ts）
- [ ] completeness: 基于三层覆盖率
- [ ] humanReviewed: 基于生命周期状态

### 7. 治理数据输出（为 Board 消费）
- [ ] 实现 governance-writer.ts — 写入 .edith/governance/ JSON 文件
- [ ] health.json — 全局健康度
- [ ] lifecycle.json — 生命周期分布
- [ ] conflicts.json — 活跃冲突列表
- [ ] 状态变更时自动更新

### 8. CLI 命令集成
- [ ] edith governance status — 全局状态概览 + 健康度
- [ ] edith governance review --confirm <file> — 审阅确认
- [ ] edith governance review --resolve <file> --action <accept|preserve|merge> — 冲突裁决
- [ ] distill 集成：新产物自动标记 scaffold
- [ ] distill --refresh 集成：状态机转换 + 矛盾检测
- [ ] extension.ts 注册 governance 工具

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-05 | Feature redesigned | 生态视角重写，复用 Vault 基础设施，为 Board 提供数据 |
