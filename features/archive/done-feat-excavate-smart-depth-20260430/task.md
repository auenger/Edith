# Tasks: feat-excavate-smart-depth

## Task Breakdown

### 1. 项目规模检测模块
- [x] 实现源文件计数逻辑（排除 node_modules/.git/dist/build 等）
- [x] 定义规模阈值常量（small/medium/large/xlarge）

### 2. 模块边界识别
- [x] 识别 monorepo 模式（packages/、apps/、libs/）
- [x] 识别微服务模式（services/、cmd/、internal/）
- [x] 识别多层模式（client+server、frontend+backend）

### 3. 深度策略引擎
- [x] 实现规模 → 深度级别映射
- [x] 支持手动覆盖参数（--depth）
- [x] 在 scan 启动时自动执行策略选择

### 4. SKILL.md 更新
- [x] 更新 document-project SKILL.md 的深度策略描述
- [x] 替换手动三级为智能选择 + 手动覆盖

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-30 | Feature created | 子特性 1/3 |
| 2026-04-30 | Implementation complete | commit f822d03 |
