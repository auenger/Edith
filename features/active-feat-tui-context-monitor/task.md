# Tasks: feat-tui-context-monitor

## Task Breakdown

### 1. Token 追踪器模块
- [ ] 创建 `agent/src/context-monitor.ts`
- [ ] 实现 `ContextMonitor` 类：采集 session stats + context usage
- [ ] **Context Window 动态获取**：优先 session API → edith.yaml 覆盖 → 模型名查表
- [ ] 维护滑动窗口趋势数据（最近 10 轮 token 变化）
- [ ] 计算缓存命中率
- [ ] 估算剩余可用轮次

### 2. 状态栏指标渲染
- [ ] 创建 ink 组件 `StatusBarMetrics`：token 用量 + 占比 + 缓存命中率
- [ ] 颜色分级：<70% 绿 / 70-85% 黄 / 85-95% 橙 / >95% 红
- [ ] 数字格式化（K/M 简写，千位分隔符）
- [ ] 集成到 ink 布局状态栏右侧

### 3. 上下文压力预警系统
- [ ] 创建 `agent/src/context-warn.ts`
- [ ] 实现分级预警逻辑（黄/橙/红三级）
- [ ] 每轮对话结束后检查占比，超过阈值触发预警
- [ ] 预警条渲染组件（不中断对话流）

### 4. Compact 前置钩子
- [ ] 拦截 auto-compact 触发点
- [ ] 展示风险说明面板（可能丢失的信息类型 + 示例）
- [ ] 实现"提取摘要后 compact"选项
- [ ] 用户手动 `/compact` 时也展示相同提示

### 5. 配置集成
- [ ] `edith.yaml` 新增 `llm.context_window` 可选字段（手动覆盖）
- [ ] `edith.yaml` 新增 `context_monitor` 配置节（开关 + 阈值）
- [ ] `config.ts` 新增对应类型定义和默认值
- [ ] 建立模型名→context window 查表兜底（deepseek-v4: 1M, claude-sonnet-4-6: 200K 等）

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | Spec + tasks defined |
