# Feature: feat-tui-context-monitor Context 上下文主动监控与预警

## Basic Information
- **ID**: feat-tui-context-monitor
- **Name**: Context 上下文主动监控与预警
- **Priority**: 68
- **Size**: M
- **Dependencies**: [feat-tui-ink-layout, feat-context-command]
- **Parent**: feat-tui-redesign
- **Children**: []
- **Created**: 2026-04-28

## Description

在 TUI 常驻状态栏实时展示上下文占用指标（tokens、缓存命中率），并在上下文空间即将不足时主动预警，提醒用户自动 compact 可能导致关键信息丢失或幻觉。

与 `feat-context-command`（手动 `/context` 命令）互补：本 feature 实现**被动式/主动式监控**，不需要用户主动触发。

### 核心诉求
- **常驻可见**：状态栏始终展示 token 用量、上下文占比、缓存命中率
- **主动预警**：上下文占用超过阈值时自动弹出警告（不中断对话）
- **Compact 风险提示**：在自动压缩触发前提醒用户关键信息可能丢失，给出建议

## User Value Points

### VP1: 常驻 Token 指标面板
状态栏实时展示：当前 tokens / context window、input/output 分项、缓存命中（cache read/write）。用户无需任何操作即可感知上下文消耗趋势。

### VP2: 上下文压力预警
当上下文占用超过阈值（如 70% 黄色、85% 橙色、95% 红色）时，在对话区域顶部显示分级警告条。提醒用户即将触发自动 compact。

### VP3: Compact 风险与建议提示
在自动 compact 触发前（或用户手动 compact 时），展示风险说明：
- 可能丢失哪些信息（本轮关键决策、代码上下文、工具调用结果）
- 建议：哪些内容需要用户显式保存或总结
- 缓解措施：自动提取关键摘要后执行 compact

## Context Analysis

### Reference Code
- `agent/src/extension.ts` — pi SDK session API 调用入口
- `agent/src/agent-startup.ts` — REPL 循环、compact 触发逻辑
- `agent/src/theme/` — TUI 渲染基础设施（Banner、渐变色、状态栏）
- `agent/src/config.ts` — token budget 配置

### pi SDK API 可用性
- `session.getSessionStats()` → tokens{input, output, cacheRead, cacheWrite, total}, cost
- `session.getContextUsage()` → tokens, contextWindow, percent
- pi SDK 内置 auto-compact 机制（约 10 轮后或接近上限触发）

### Related Documents
- `agent/edith.yaml` — token_budget 配置
- `SCALABILITY-ANALYSIS.md` — 三层加载与 token 管理设计

### Related Features
- `feat-context-command`（pending）— 手动 `/context` 命令，复用相同 API
- `feat-tui-ink-layout`（pending）— ink TUI 框架，提供状态栏渲染位置
- `feat-tui-streaming`（pending）— 流式输出，需协调渲染布局

## Technical Solution
<!-- To be filled during implementation -->

### 初步方向

1. **Context Window 动态获取**（关键设计）
   - **主路径**：从 `session.getContextUsage().contextWindow` 运行时获取，不硬编码
   - **覆盖路径**：支持 `edith.yaml` 新增 `llm.context_window` 字段手动覆盖（应对 API 返回不准确的场景）
   - **模型差异**：DeepSeek V4 = 1M, Claude Sonnet = 200K, GPT-4o = 128K, 等等
   - 初始化时优先级：`edith.yaml 覆盖值` > `session API 返回值` > `模型名查表兜底`

2. **Token 追踪器**（`agent/src/context-monitor.ts`）
   - 每次 API 调用后采集 `getSessionStats()` + `getContextUsage()`
   - 维护滑动窗口趋势数据（最近 N 轮的 token 变化）
   - 计算缓存命中率 = cacheRead / (cacheRead + cacheWrite + input)

3. **状态栏渲染**（ink 组件）
   - 右侧固定区域展示：`CTX 12.4K/1M (1.2%) | Cache: 42%`
   - 数字自适应格式化：<1K 直接显示、1K-999K 用 K、>=1M 用 M
   - 颜色随占比变化：<70% 绿色、70-85% 黄色、85-95% 橙色、>95% 红色

4. **预警系统**（`agent/src/context-warn.ts`）
   - 每轮对话结束后检查上下文占比
   - 超过阈值时在对话区顶部插入预警条
   - 预警内容：当前占比 + 预估剩余轮次 + 建议操作

5. **Compact 前置钩子**
   - 拦截 auto-compact 触发点
   - 展示风险说明面板
   - 提供"提取摘要后 compact"选项

### edith.yaml 新增配置

```yaml
llm:
  provider: deepseek
  model: deepseek-v4
  # context_window: 1000000   # 可选，手动覆盖 context window 大小
                               # 不填则从 session API 自动获取

context_monitor:
  enabled: true                # 开关
  thresholds:                  # 预警阈值（百分比）
    warning: 70                # 黄色预警
    critical: 85               # 橙色预警
    emergency: 95              # 红色紧急
```

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，我希望在对话过程中始终能看到上下文消耗状态，并在空间即将不足时收到预警，避免自动 compact 导致关键信息意外丢失。

### Scenarios

#### Scenario 1: 状态栏常驻展示 token 指标
```gherkin
Given 用户已启动 EDITH Agent（配置 deepseek-v4，1M context window）
When 进行任意一轮对话
Then 状态栏右侧显示当前 token 用量和上下文窗口占比
And context window 大小从 session API 动态获取（显示为 1M 而非写死 200K）
And 显示缓存命中率百分比
And 指标颜色随占比变化（绿→黄→橙→红）
And 数字自适应格式化（<1K 直接显示、1K-999K 用 K、>=1M 用 M）
```

#### Scenario 2: 上下文压力黄色预警
```gherkin
Given 上下文占用超过 70%
When 助手完成当前回复
Then 对话区顶部显示黄色警告条："⚠ Context 72% used — 建议适时 compact"
And 警告不中断对话流程
And 用户可继续正常输入
```

#### Scenario 3: 上下文压力红色预警
```gherkin
Given 上下文占用超过 95%
When 助手完成当前回复
Then 对话区顶部显示红色警告条："🔴 Context 96% — 即将自动 compact，关键信息可能丢失"
And 建议用户执行 /compact 或 /new
And 建议用户保存重要信息
```

#### Scenario 4: Compact 前风险提示
```gherkin
Given 系统即将触发自动 compact
When compact 执行前
Then 展示风险说明面板，包含：
  | 可能丢失的内容类型 | 示例 |
  | 本轮关键决策 | "选择 PostgreSQL 而非 MySQL" |
  | 代码上下文 | "正在修改的文件路径" |
  | 工具调用结果 | "scan 工具返回的服务列表" |
And 提供"提取摘要后 compact"选项
```

#### Scenario 5: 缓存命中率展示
```gherkin
Given 用户进行了多轮对话
When 查看状态栏
Then 显示 cache hit rate 百分比
And 高命中率（>50%）显示为绿色，表示高效利用
And 低命中率（<20%）显示为灰色，表示可优化空间
```

#### Scenario 6: 预估剩余轮次
```gherkin
Given 上下文已使用 80%
When 显示预警信息
Then 基于滑动窗口平均消耗估算剩余可用轮次
And 展示 "≈ 还剩 5-8 轮对话"
```

### General Checklist
- [ ] 状态栏指标不与流式输出渲染冲突
- [ ] 预警不中断用户输入
- [ ] Token 数字格式化（K/M 简写）
- [ ] 缓存命中率计算准确
- [ ] 适配不同 context window 大小（模型差异）
- [ ] 预警阈值可通过 edith.yaml 配置
