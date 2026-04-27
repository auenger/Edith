# JARVIS Feature Queue — 全量 Review 报告

> 日期: 2026-04-27 | 审查范围: 11 pending + 1 completed + 6 未创建目录

---

## 总览

| # | Feature ID | 名称 | P | Size | Score | 状态 |
|---|-----------|------|---|------|-------|------|
| 1 | feat-agent-scaffold | Agent 项目骨架 | 100 | M | 68 | ⚠️ CAUTION |
| 2 | feat-extension-core | Extension 核心路由层 | 95 | M | 72 | ⚠️ CAUTION |
| 3 | feat-tool-scan | jarvis_scan 工具 | 95 | M | 68 | ⚠️ CAUTION |
| 4 | feat-config-management | jarvis.yaml 配置管理 | 90 | S | 62 | ⚠️ CAUTION |
| 5 | feat-tool-distill | jarvis_distill 工具 | 90 | M | 72 | ⚠️ CAUTION |
| 6 | feat-tool-query | jarvis_query 工具 | 90 | M | 70 | ⚠️ CAUTION |
| 7 | feat-tool-route | jarvis_route 工具 | 85 | S | 62 | ⚠️ CAUTION |
| 8 | feat-tui-branding | TUI 主题定制 | 80 | S | **84** | ✅ PASS |
| 9 | feat-system-prompt | System Prompt 调优 | 80 | S | 62 | ⚠️ CAUTION |
| 10 | feat-e2e-pilot | 端到端试点验证 | 85 | L | 70 | ⚠️ CAUTION |
| 11 | feat-packaging | Pi Package 打包与分发 | 75 | S | **52** | 🔴 BLOCK |

**总评**: 11 个 pending feature 中，1 个 PASS、9 个 CAUTION、1 个 BLOCK。
- 平均分: **68.2/100**
- 中位数: **70/100**

---

## 通用问题（影响 10/11 个 feature）

### G1: task.md 全部为模板骨架
**严重度: Critical | 影响范围: 10/11 feature**

除 `feat-tui-branding` 外，所有 task.md 都是同一个三段式模板：
```
1. Preparation — Read spec.md...
2. Implementation — Core implementation tasks (see spec.md)...
3. Verification — Verify acceptance criteria...
```

这不是可执行的任务分解，只是占位符。开发者无法从中了解具体实施步骤。

**建议**: 每个 task.md 应将 spec.md 的 Technical Solution 拆解为可独立执行、有验收标准的任务项。参考 `feat-tui-branding/task.md`（20+ 具体任务）。

### G2: checklist.md 全部为通用模板
**严重度: Warning | 影响范围: 10/11 feature**

除 `feat-tui-branding` 外，所有 checklist.md 使用同一个 28 行通用清单。不包含 feature 特有的验收项。

**建议**: 每个 checklist 应从 spec.md 的 Gherkin scenarios 和 value points 派生，包含 feature 特有的验收标准。

### G3: 缺少 OUT scope（不做什么）
**严重度: Warning | 影响范围: 11/11 feature**

没有任何 feature 定义 "本 feature 不做什么" 的边界。这可能导致开发时范围蔓延。

**建议**: 在每个 spec.md 的 Description 末尾添加明确的 OUT scope：
```markdown
## Scope
- IN: ...
- OUT: ...
```

---

## 各 Feature 详细评审

### 1. feat-agent-scaffold — 68/100 ⚠️

| 维度 | 得分 | 关键问题 |
|------|------|---------|
| D1 Clarity | 14/20 | 无 OUT scope |
| D2 Completeness | 12/20 | 无错误路径场景（pi SDK 安装失败？jarvis.yaml 格式错误？） |
| D3 Consistency | 12/20 | task.md/checklist.md 为模板骨架 |
| D4 Feasibility | 16/20 | 参考文件均存在 |
| D5 Gherkin | 14/20 | 3 个场景均为 happy path，无 sad-path |

**风险**: 作为 Phase 1 的根 feature，依赖此节点的 feature 有 10 个。如果骨架搭建不完整，影响面极大。

---

### 2. feat-extension-core — 72/100 ⚠️

| 维度 | 得分 | 关键问题 |
|------|------|---------|
| D1 Clarity | 16/20 | 无 OUT scope |
| D2 Completeness | 14/20 | 无工具注册失败、pi SDK API 不兼容等错误场景 |
| D3 Consistency | 10/20 | task.md 模板，checklist 未覆盖 6 个场景 |
| D4 Feasibility | 16/20 | 参考文件存在，架构一致 |
| D5 Gherkin | 16/20 | 6 个场景覆盖完整（4 个工具 + 3 个上下文命令） |

**亮点**: spec.md 质量较高，Technical Solution 详细描述了 Phase 1/Phase 2 的渐进策略。

**风险**: 依赖 pi SDK 的 `registerTool()` / `registerCommand()` API，需确认这些 API 已稳定。

---

### 3. feat-tool-scan — 68/100 ⚠️

| 维度 | 得分 | 关键问题 |
|------|------|---------|
| D1 Clarity | 14/20 | 无 OUT scope，mode 参数未详细说明 |
| D2 Completeness | 14/20 | 缺少边界场景（空项目、超大型代码库、不支持的语言） |
| D3 Consistency | 10/20 | task.md 模板 |
| D4 Feasibility | 16/20 | 参考 SKILL.md 和 agents/ 目录均存在 |
| D5 Gherkin | 14/20 | 有 1 个 sad-path（Scenario 3），覆盖合理 |

---

### 4. feat-config-management — 62/100 ⚠️

| 维度 | 得分 | 关键问题 |
|------|------|---------|
| D1 Clarity | 14/20 | 无 OUT scope |
| D2 Completeness | 12/20 | 缺少 YAML 语法错误、配置迁移、热加载失败等场景 |
| D3 Consistency | 10/20 | task.md 模板 |
| D4 Feasibility | 16/20 | TypeScript interface 定义清晰 |
| D5 Gherkin | 12/20 | Scenario 3 (jarvis-init) Then 步骤不够具体 |

**关注点**: "热加载" 在 Description 中提到但 Gherkin 未覆盖。这是一个复杂特性，建议拆分或在 spec 中明确 Phase 1 不做热加载。

---

### 5. feat-tool-distill — 72/100 ⚠️

| 维度 | 得分 | 关键问题 |
|------|------|---------|
| D1 Clarity | 16/20 | 三层产出物的 token 预算定义清晰 |
| D2 Completeness | 14/20 | 缺少超 token 预算时的截断策略场景 |
| D3 Consistency | 10/20 | task.md 模板 |
| D4 Feasibility | 16/20 | 架构一致，参考文件存在 |
| D5 Gherkin | 16/20 | 有 sad-path，token 预算场景可验证 |

**亮点**: Token 预算控制场景（Scenario 2）量化清晰（<= 2000）。

---

### 6. feat-tool-query — 70/100 ⚠️

| 维度 | 得分 | 关键问题 |
|------|------|---------|
| D1 Clarity | 16/20 | 三层加载策略描述清晰 |
| D2 Completeness | 14/20 | 缺少部分 Layer 产物缺失、文件损坏等场景 |
| D3 Consistency | 10/20 | task.md 模板 |
| D4 Feasibility | 16/20 | 架构一致 |
| D5 Gherkin | 14/20 | 有空知识库场景（Scenario 3），覆盖合理 |

---

### 7. feat-tool-route — 62/100 ⚠️

| 维度 | 得分 | 关键问题 |
|------|------|---------|
| D1 Clarity | 14/20 | 路由决策表清晰，但无 OUT scope |
| D2 Completeness | 12/20 | **无错误场景**，无边界情况 |
| D3 Consistency | 10/20 | task.md 模板 |
| D4 Feasibility | 16/20 | 架构一致 |
| D5 Gherkin | 12/20 | **Scenario 1 缺少 Given**；全部为 happy path |

**问题**: Scenario 1 没有 Given 前置条件。路由表的格式和内容未在场景中描述。

---

### 8. feat-tui-branding — 84/100 ✅ **最佳**

| 维度 | 得分 | 关键问题 |
|------|------|---------|
| D1 Clarity | 18/20 | ANSI escape sequence、色值、降级策略极其具体 |
| D2 Completeness | 16/20 | 覆盖 4 级终端降级，checklist 含窄终端等边界 |
| D3 Consistency | 16/20 | **唯一有详细 task.md 和定制 checklist 的 feature** |
| D4 Feasibility | 16/20 | 技术方案成熟，降级策略完整 |
| D5 Gherkin | 18/20 | 6 个场景覆盖全面，色值精确到 hex |

**标杆**: 这个 feature 的文档质量是全队列最高。建议其他 feature 参考 `feat-tui-branding` 的 task.md 和 checklist.md 结构。

---

### 9. feat-system-prompt — 62/100 ⚠️

| 维度 | 得分 | 关键问题 |
|------|------|---------|
| D1 Clarity | 14/20 | 触发映射清晰 |
| D2 Completeness | 10/20 | **仅 3 个场景**，缺少模糊输入、多意图冲突等边界 |
| D3 Consistency | 10/20 | task.md 模板 |
| D4 Feasibility | 16/20 | 架构一致 |
| D5 Gherkin | 12/20 | **3 个场景均缺少 Given**；无 sad-path |

**关注点**: System Prompt 是 Agent 行为的核心，3 个场景远不够。应覆盖：模糊输入、多意图、工具不可用、超长对话等场景。

---

### 10. feat-e2e-pilot — 70/100 ⚠️

| 维度 | 得分 | 关键问题 |
|------|------|---------|
| D1 Clarity | 16/20 | E2E 流程清晰 |
| D2 Completeness | 14/20 | 缺少中间步骤失败时的行为 |
| D3 Consistency | 10/20 | task.md 模板 |
| D4 Feasibility | 16/20 | 参考文件存在 |
| D5 Gherkin | 14/20 | "零适配消费验证"（Scenario 3）设计出色 |

**亮点**: Scenario 3 "产出物零适配消费验证" 是一个关键的架构验证点。

---

### 11. feat-packaging — 52/100 🔴 BLOCK

| 维度 | 得分 | 关键问题 |
|------|------|---------|
| D1 Clarity | 12/20 | spec 极薄，Technical Solution 仅 4 行 bullet |
| D2 Completeness | 8/20 | **仅 2 个场景**，无错误路径、无版本冲突处理 |
| D3 Consistency | 8/20 | task.md 模板，Technical Solution 不具体 |
| D4 Feasibility | 14/20 | 依赖 pi SDK 打包机制，成熟度未知 |
| D5 Gherkin | 10/20 | 场景数量不足，深度不够 |

**建议**: 需要重新丰富 spec：
- 添加 pi SDK package 机制的调研结果
- 补充安装失败、版本回退、多环境兼容场景
- 细化 Technical Solution

---

## 依赖图分析

```text
feat-agent-scaffold (P100, 68) ─── 根节点，无依赖
├── feat-extension-core (P95, 72)
│   ├── feat-tool-scan (P95, 68)
│   │   └── feat-tool-distill (P90, 72)
│   ├── feat-tool-query (P90, 70)
│   └── feat-tool-route (P85, 62)
├── feat-config-management (P90, 62)
└── feat-tui-branding (P80, 84)

feat-system-prompt (P80, 62) ← 依赖 [scan, distill, query, route]
feat-e2e-pilot (P85, 70)     ← 依赖 [scan, distill, query, route]
feat-packaging (P75, 52)     ← 依赖 [e2e-pilot]
```

### 可并行开发的波次

| 波次 | Features | 说明 |
|------|----------|------|
| Wave 1 | feat-agent-scaffold | 根节点，必须先完成 |
| Wave 2 | feat-extension-core, feat-config-management, feat-tui-branding | 三者并行（均仅依赖 scaffold） |
| Wave 3 | feat-tool-scan, feat-tool-query, feat-tool-route | 三个工具并行（均仅依赖 extension-core） |
| Wave 4 | feat-tool-distill | 依赖 extension-core + tool-scan |
| Wave 5 | feat-system-prompt, feat-e2e-pilot | 并行（均依赖全部工具） |
| Wave 6 | feat-packaging | 收尾，依赖 e2e-pilot |

---

## 风险评估

| # | 风险 | 级别 | 影响 feature | 缓解措施 |
|---|------|------|-------------|---------|
| 1 | pi SDK API 不稳定 | 🔴 High | scaffold, extension-core, tui-branding, packaging | Wave 1 先验证 pi SDK registerTool/registerCommand API 可用性 |
| 2 | 范围蔓延（无 OUT scope） | 🟡 Medium | 全部 11 个 | 每个 spec 添加 OUT scope |
| 3 | feat-packaging spec 过薄 | 🔴 High | packaging | 重新丰富 spec 后再排入开发 |
| 4 | feat-system-prompt 场景不足 | 🟡 Medium | system-prompt | 补充至少 5 个边界场景 |
| 5 | 10/11 feature task.md 不可执行 | 🟡 Medium | 除 tui-branding 外全部 | 开发前 enrich task.md |
| 6 | feat-tool-route 缺少前置条件 | 🟢 Low | tool-route | 补充 Given 步骤 |

---

## 建议的优先行动

### P0 — 阻塞开发（必须先修复）
1. **enrich feat-agent-scaffold 的 task.md** — 这是根节点，后续所有 feature 依赖它
2. **验证 pi SDK 可用性** — 确认 `registerTool()` / `registerCommand()` API 存在且可用

### P1 — 开发前修复
3. **enrich Wave 2 的 task.md** — feat-extension-core、feat-config-management、feat-tui-branding
4. **重新丰富 feat-packaging 的 spec** — 当前仅 2 个场景，不足以指导开发

### P2 — 开发中改进
5. 每个 feature 开发前补充 OUT scope
6. feat-system-prompt 补充边界场景
7. feat-tool-route 补充 Given 前置条件和错误场景

---

## Phase 2 Features（未创建目录）

以下 6 个 feature 在 queue.yaml 中定义但尚未创建目录和文档：
- feat-board-scaffold (P60, M)
- feat-board-dashboard (P60, M)
- feat-board-services (P55, S)
- feat-board-artifacts (P55, M)
- feat-board-knowledge-map (P50, M)
- feat-board-timeline (P50, S)

这些属于 Phase 2，在 Phase 1 完成前不需要处理。

---

*报告生成: 2026-04-27 | 使用 /review-spec skill*
