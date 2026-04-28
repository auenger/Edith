# Spec Review Report: All Pending Features

> 日期: 2026-04-28 | 审查范围: 8 pending features (7 enriched + 1 parent)
> 归档参考: 13 archived features scanned (Phase 1 MVP，无直接相关问题)
> 引用文件: 10/10 验证存在 ✅

---

## 总览

| # | Feature ID | 名称 | P | Size | Score | 状态 |
|---|-----------|------|---|------|-------|------|
| 1 | feat-context-command | Context 上下文命令 | 70 | S | **90** | ✅ PASS |
| 2 | feat-context-monitor | Context 主动监控与预警 | 68 | M | **90** | ✅ PASS |
| 3 | feat-explore-project | 项目探索命令 | 65 | M | **86** | ✅ PASS |
| 4 | feat-tui-ink-layout | TUI 布局框架 | 70 | M | **84** | ✅ PASS |
| 5 | feat-tui-thinking | AI 思考过程展示 | 65 | S | **82** | ✅ PASS |
| 6 | feat-subagent-support | SubAgent 子代理支持 | 55 | M | **76** | ⚠️ CAUTION |
| 7 | feat-tui-streaming | 流式输出增强 | 60 | M | **76** | ⚠️ CAUTION |
| 8 | feat-tui-redesign | TUI 交互重设计 (parent) | 70 | L | **74** | ⚠️ CAUTION |

**总评**: 8 个 pending feature 中，5 个 PASS、3 个 CAUTION。
- 平均分: **82.3/100**（比上一轮 68.2 提升显著，enrichment 效果明显）
- 唯一 Critical 问题来自 feat-tui-redesign 父子不一致

---

## Critical Issues（必须修复）

### C1: feat-tui-redesign — 子特性数量不一致
- **Location**: `features/pending-feat-tui-redesign/spec.md` > Technical Solution + Children
- **Dimension**: D3 Consistency
- **Problem**: spec 声明 "拆分策略: 3 个子特性依次交付"，Children 只列了 3 个。但 queue.yaml 中 feat-tui-redesign 有 **4 个 children**（含 feat-tui-context-monitor）。feat-tui-context-monitor 在父 spec 中完全未被提及。
- **Impact**: 父 spec 缺失子特性定义，可能导致验收时遗漏 context-monitor 或职责不清。
- **Suggested Fix**:
  - 方案 A: 更新 spec.md Children 列表为 4 个，更新依赖链图
  - 方案 B: 将 feat-tui-context-monitor 从 tui-redesign 中独立（移除 parent 关系）

### C2: feat-subagent-support — VP2 并行处理无 Gherkin 场景
- **Location**: `features/pending-feat-subagent-support/spec.md` > Acceptance Criteria
- **Dimension**: D5 Gherkin Quality
- **Problem**: VP2（并行处理能力）是核心价值点，但 3 个 Gherkin 场景全是单任务委派/失败，没有并行执行场景。task.md 的 `parallel()` 方法也无对应验收场景。
- **Impact**: 并行是 SubAgentManager 的核心方法，没有验收场景意味着无法验证核心价值。
- **Suggested Fix**: 新增 Scenario 4 — 并行委派多个子代理执行独立任务

### C3: feat-explore-project — VP2 搜索与发现无 Gherkin 场景
- **Location**: `features/pending-feat-explore-project/spec.md` > Acceptance Criteria
- **Dimension**: D5 Gherkin Quality
- **Problem**: VP2（搜索与发现）描述了 glob/grep 搜索能力，Technical Solution 也提到了搜索功能，但无对应 Gherkin 场景，task 中也没有搜索相关任务。
- **Impact**: 搜索能力是 spec 定义的 User Value Point，但不被 task 和 Gherkin 覆盖。
- **Suggested Fix**: 新增搜索场景 Gherkin + task，或将 VP2 从 scope 中移除

### C4: feat-tui-streaming — 缺少错误路径场景
- **Location**: `features/pending-feat-tui-streaming/spec.md` > Acceptance Criteria
- **Dimension**: D2 Completeness + D5 Gherkin
- **Problem**: 3 个场景全是 happy path。不完整 Markdown、解析失败、大输出性能均未覆盖。
- **Impact**: 流式 Markdown 渲染是高风险区域（AST 解析、终端兼容性），没有错误场景容易在边界条件下崩溃。
- **Suggested Fix**: 新增至少 1 个错误/降级场景

### C5: feat-tui-redesign — 缺少 task.md 和 checklist.md
- **Location**: `features/pending-feat-tui-redesign/` 目录
- **Dimension**: D3 Consistency
- **Problem**: 父级 feature 缺少 task.md 和 checklist.md。
- **Impact**: 作为 split=true 的索引 feature，缺少验证清单。
- **Suggested Fix**: 至少补充 checklist.md，列出子特性全部通过验收的条件

---

## Warnings

### W1: 多个 TUI feature 缺少错误/降级 Gherkin 场景
- **Affected**: feat-tui-ink-layout, feat-tui-thinking, feat-tui-streaming
- **Dimension**: D2 Completeness
- **Detail**: ink 渲染失败 fallback、模型无 thinking 内容、流式 Markdown 解析错误均未覆盖
- **Suggestion**: 每个 feature 补充至少 1 个 sad-path 场景

### W2: feat-tui-streaming 缺少量化性能指标
- **Location**: spec.md > Checklist
- **Dimension**: D1 Clarity
- **Detail**: "大输出性能可接受"、">1000 行不卡顿" 无具体阈值
- **Suggestion**: 定义量化目标，如 "1000 行渲染 < 500ms"

### W3: feat-tui-thinking 的 T 键冲突风险
- **Location**: spec.md > Technical Solution
- **Dimension**: D4 Feasibility
- **Detail**: T 键在输入框聚焦时应输入字母而非触发展开
- **Suggestion**: 明确快捷键只在非输入状态生效，或改用 Ctrl+T

### W4: feat-subagent-support 自动识别逻辑未定义
- **Location**: spec.md > Technical Solution > 命令注册
- **Dimension**: D1 Clarity
- **Detail**: `name: "auto"` 自动选择 agent，但无识别规则
- **Suggestion**: 补充识别规则或改为用户手动指定

### W5: feat-tui-ink-layout 缺少回退方案
- **Location**: spec.md > Technical Solution
- **Dimension**: D2 Completeness
- **Detail**: ink 渲染在终端不兼容时无 fallback 到 readline 的机制
- **Suggestion**: 添加终端能力检测 + 自动回退

### W6: feat-tui-context-monitor 双依赖风险
- **Location**: queue.yaml > dependencies
- **Dimension**: D4 Feasibility
- **Detail**: 同时依赖 feat-tui-ink-layout + feat-context-command，任一接口变更需返工
- **Suggestion**: 开发前确认依赖 feature 的接口约定

### W7: extension.ts 合并冲突风险
- **Affected**: feat-context-command, feat-explore-project, feat-tui-ink-layout, feat-subagent-support
- **Dimension**: D4 Feasibility
- **Detail**: 归档显示 feat-tool-route 曾在 `extension.ts` 冲突，4 个新 feature 也都修改此文件
- **Suggestion**: 按 queue.yaml 优先级顺序开发，避免并行修改 extension.ts

---

## Improvement Suggestions

### S1: 统一 Gherkin 格式风格
- **Affected**: 全部 features
- **Detail**: feat-context-command 使用 `#### Scenario N:` 格式，TUI 系列使用内联 `Scenario:` 格式

### S2: feat-tui-redesign 父子场景去重
- **Affected**: feat-tui-redesign
- **Detail**: "启动显示全屏布局"在父子中重复定义，父级应只保留端到端集成场景

### S3: feat-subagent-support checklist 按 Phase 分组
- **Affected**: feat-subagent-support
- **Detail**: Phase 1/2 边界清晰但 checklist 未区分

### S4: feat-tui-streaming 先确定 Markdown 渲染方案
- **Affected**: feat-tui-streaming
- **Detail**: "ink-markdown 或自定义方案"未定，开发中决策可能导致返工

### S5: feat-tui-thinking 开发前验证 pi SDK thinking 事件
- **Affected**: feat-tui-thinking
- **Detail**: 多次提到"需确认"，是前置不确定性

---

## Per-Feature Score Details

### 1. feat-context-command: 90/100 ✅ PASS

| Dimension | Score | Notes |
|-----------|-------|-------|
| D1 Clarity | 16/20 | 缺显式 OUT scope |
| D2 Completeness | 18/20 | 空 session 场景覆盖好 |
| D3 Consistency | 18/20 | spec/task/checklist 对齐良好 |
| D4 Feasibility | 20/20 | 引用文件均存在，依赖已完成 |
| D5 Gherkin | 18/20 | 覆盖 2 个 VP + 边界场景 |

### 2. feat-tui-context-monitor: 90/100 ✅ PASS

| Dimension | Score | Notes |
|-----------|-------|-------|
| D1 Clarity | 18/20 | 阈值、格式、配置都具体 |
| D2 Completeness | 18/20 | 6 个场景覆盖全面 |
| D3 Consistency | 18/20 | 对齐良好 |
| D4 Feasibility | 18/20 | 三层回退设计（API → config → 查表）|
| D5 Gherkin | 18/20 | 多压力级别 + 缓存命中率 |

### 3. feat-explore-project: 86/100 ✅ PASS

| Dimension | Score | Notes |
|-----------|-------|-------|
| D1 Clarity | 16/20 | 与 edith_scan 区分清晰 |
| D2 Completeness | 16/20 | 缺性能量化指标 |
| D3 Consistency | 18/20 | 对齐良好 |
| D4 Feasibility | 20/20 | 引用文件均存在 |
| D5 Gherkin | 16/20 | **VP2 搜索能力无场景** (C3) |

### 4. feat-tui-ink-layout: 84/100 ✅ PASS

| Dimension | Score | Notes |
|-----------|-------|-------|
| D1 Clarity | 18/20 | 架构和组件树清晰 |
| D2 Completeness | 14/20 | 无 fallback 场景 |
| D3 Consistency | 18/20 | 对齐良好 |
| D4 Feasibility | 18/20 | ink 成熟，但终端兼容需注意 |
| D5 Gherkin | 16/20 | "不截断不溢出" 主观 |

### 5. feat-tui-thinking: 82/100 ✅ PASS

| Dimension | Score | Notes |
|-----------|-------|-------|
| D1 Clarity | 16/20 | 交互设计清晰 |
| D2 Completeness | 14/20 | 无 thinking 缺失场景 |
| D3 Consistency | 18/20 | 对齐良好 |
| D4 Feasibility | 16/20 | 依赖未创建文件 + API 不确定 |
| D5 Gherkin | 18/20 | 覆盖好 |

### 6. feat-subagent-support: 76/100 ⚠️ CAUTION

| Dimension | Score | Notes |
|-----------|-------|-------|
| D1 Clarity | 16/20 | 自动识别逻辑未定义 |
| D2 Completeness | 14/20 | 缺并行边界和输入验证 |
| D3 Consistency | 18/20 | 对齐良好 |
| D4 Feasibility | 18/20 | pi SDK 无内置 subAgent |
| D5 Gherkin | 10/20 | **VP2 完全无覆盖** (C2) |

### 7. feat-tui-streaming: 76/100 ⚠️ CAUTION

| Dimension | Score | Notes |
|-----------|-------|-------|
| D1 Clarity | 16/20 | 无性能量化指标 |
| D2 Completeness | 12/20 | 无错误路径 |
| D3 Consistency | 18/20 | 对齐良好 |
| D4 Feasibility | 16/20 | 技术选型未定 |
| D5 Gherkin | 14/20 | 无 sad-path (C4) |

### 8. feat-tui-redesign: 74/100 ⚠️ CAUTION

| Dimension | Score | Notes |
|-----------|-------|-------|
| D1 Clarity | 16/20 | 拆分策略与实际不一致 |
| D2 Completeness | 14/20 | 无错误场景 |
| D3 Consistency | 12/20 | **缺 task/checklist，子特性数不一致** (C1/C5) |
| D4 Feasibility | 18/20 | 架构决策明确 |
| D5 Gherkin | 14/20 | 与子 feature 重叠 |

---

## Risk Assessment

| # | Risk | Level | Affected Feature | Mitigation |
|---|------|-------|-----------------|------------|
| 1 | ink 终端兼容性 | Medium | feat-tui-ink-layout | 终端检测 + readline 回退 |
| 2 | pi SDK 无 thinking 事件 | Medium | feat-tui-thinking | 开发前 API 验证 |
| 3 | 流式 Markdown 性能瓶颈 | Medium | feat-tui-streaming | 限制渲染行数 + 虚拟滚动 |
| 4 | 子进程管理复杂度 | Medium | feat-subagent-support | 借鉴 pi SDK 官方示例 |
| 5 | extension.ts 合并冲突 | Medium | 4 个 feature | 按优先级顺序开发 |
| 6 | TUI 依赖链过长 | Low | feat-tui-context-monitor | 先稳定 ink-layout 接口 |

---

## 可并行开发的波次

```text
Wave 1: feat-context-command (S), feat-tui-ink-layout (M)  — 无互相依赖
Wave 2: feat-explore-project (M)                            — 无依赖，可与 Wave 1 并行
         feat-subagent-support (M)                           — 无依赖，可与 Wave 1 并行
Wave 3: feat-tui-thinking (S), feat-tui-streaming (M)       — 依赖 feat-tui-ink-layout
Wave 4: feat-tui-context-monitor (M)                        — 依赖 ink-layout + context-command
```

---

## 建议优先行动

### P0 — 修复后才能启动开发
1. **C1**: 决定 feat-tui-context-monitor 的归属（独立 or tui-redesign 子特性）
2. **C2**: feat-subagent-support 补充并行执行 Gherkin 场景
3. **C5**: feat-tui-redesign 补充 checklist.md

### P1 — 建议在开发前修复
4. **C3**: feat-explore-project 确认 VP2 搜索能力是否在 scope 内
5. **C4**: feat-tui-streaming 补充错误路径场景
6. **W3**: feat-tui-thinking 明确快捷键行为
7. **W4**: feat-subagent-support 定义自动识别规则

### P2 — 开发中改进
8. **W5**: feat-tui-ink-layout 添加终端回退方案
9. **S4**: feat-tui-streaming 确定渲染技术选型
10. **S5**: feat-tui-thinking 验证 pi SDK thinking 事件

---

*报告生成: 2026-04-28 | 使用 /review-spec skill*
