# [CLAUDE.md](https://CLAUDE.md)

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

EDITH 是组织的 AI 知识基础设施。本仓库 `create-edith-skill` 是构建 EDITH 的元技能——帮助任何 Agent 为企业生成专属的 EDITH 实例。

**当前阶段：Phase 1 — EDITH Agent MVP**，基于 pi SDK (`@mariozechner/pi-coding-agent`) 构建终端 Agent。

**仓库性质：** 文档规范 + Agent 实现混合项目。`agent/` 为 TypeScript Agent 应用（有 package.json、构建系统、测试），根目录和 `edith-skills/` 以文档和规范为主。

## 核心架构：三层知识产物

```text
Layer 0 — routing-table.md    (<500 token，常驻)
  全局服务路由表，任何 Agent 读取后自动获得路由能力

Layer 1 — quick-ref.md        (~5% 原文，每服务一张)
  验证命令、关键约束、易错点、API 端点速查

Layer 2 — distillates/*.md    (无损压缩，按需加载)
  语义拆分的蒸馏片段：接口契约、数据模型、业务逻辑
```

消费方式：**零适配**。任何 AI Agent 只需能读 Markdown 文件即可消费。

## 仓库导航

* `agent/` — EDITH Agent TypeScript 应用（`npm start` 启动）

  * `src/agent-startup.ts` — Agent 启动入口（配置加载 → Banner → Ink 渲染）

  * `src/extension.ts` — Extension 路由层（工具注册 + 命令注册）

  * `src/config.ts` — `edith.yaml` 配置加载 + 多 Profile 管理 + `edith-init` 向导

  * `src/system-prompt.ts` — System Prompt 构建 + Workspace Context 注入（repos + routing-table Layer 0）

  * `src/context-monitor.ts` — Token 计数 + 压力检测 + Cache 命中率（支持 DeepSeek/MiMo 等模型）

  * `src/query.ts` — `edith_query` 工具实现

  * `src/shared-stats.ts` — 跨组件共享状态

  * `src/theme/` — TUI 品牌化（Banner 渐变色、主题配置、Context/SubAgent 面板）

  * `src/tui/` — React + Ink TUI 组件

    * `App.tsx` — 主应用组件

    * `BannerArea.tsx` — 欢迎横幅

    * `ContentArea.tsx` — 消息内容区

    * `InputArea.tsx` — 用户输入区（readline）

    * `StatusBarMetrics.tsx` — 状态栏指标

    * `ThinkingBlock.tsx` — 截断预览式思考展示

    * `ToolCallBlock.tsx` — Claude Code 风格 Tool Call 渲染

    * `MarkdownRenderer.tsx` / `CodeBlock.tsx` — Markdown/代码渲染

    * `CommandPalette.tsx` / `command-registry.ts` — Slash 命令系统

    * `WarningBar.tsx` — 压力警告条

    * `useAgentSession.ts` — Session 管理 Hook（事件订阅 + 消息分发 + suppress 控制）

    * `types.ts` — 消息/ToolCall/Thinking 类型定义 + Reducer

  * `src/tools/` — edith_scan / edith_distill / edith_route / edith_explore / subagent

  * `edith.yaml` — Agent 运行配置（多 LLM Profile、workspace、repos、context_window、thresholds）

* `SKILL.md` — 黄金路径（8 阶段主流程），唯一权威执行路径

* `edith-skills/` — 三个运营 Skill（EDITH Agent 的内部实现）

  * `document-project/` → `edith_scan` 工具（扫描项目代码，逆向生成文档）

  * `distillator/` → `edith_distill` 工具（蒸馏文档，生成三层知识产物）

  * `requirement-router/` → `edith_route` 工具（需求路由分析）

  * `INTEGRATION.md` — Skill 与 EDITH 的融合方案

* `templates/en/` — 英文模板（权威），`templates/zh/` — 中文镜像

* `references/en/` — 英文参考文档，`references/zh/` — 中文参考

* `EDITH-PRODUCT-DESIGN.md` — 产品设计文档（Agent / Board / Artifacts 三件套）

* `SCALABILITY-ANALYSIS.md` — 微服务规模下的瓶颈分析与三层加载设计

* `project-context.md` — 技术项目上下文（目录结构、架构、命名约定、变更日志）

### Agent 架构分层

```text
用户 (自然语言)
  → TUI 层 (React + Ink 组件化终端界面)
    → BannerArea / ContentArea / StatusBarMetrics / InputArea
    → ThinkingBlock (截断预览) / ToolCallBlock (展开式渲染)
    → Slash 命令 (/model, /new, /clear, /compact, /context, /delegate, /explore)
  → Context Monitor (Token 计数 + 压力检测 + Cache 命中率)
  → Extension 路由层 (消息拦截 + Skill 自动加载 + 工具注册)
  → System Prompt (Workspace Context 注入 + routing-table Layer 0)
  → Skill 执行层 (document-project / distillator / requirement-router)
  → Tool 实现层 (edith_scan / edith_distill / edith_route / edith_query / edith_explore / subagent)
  → pi SDK (AgentSession + 多 LLM Provider + Tool Calling + 流式输出)
  → 产出物 (纯 Markdown)
```

### 配置模型

用户通过 `edith.yaml` 定制（多 LLM Profile、workspace 路径、repos 列表、context_window、token budget thresholds 等），不改代码。支持环境变量（`${VAR_NAME}`）和交互式 `edith-init` 向导。

## 工作纪律

| 纪律               | 原因                                    |
| ---------------- | ------------------------------------- |
| 产出物永远是纯 Markdown | Agent 无关性，任何 Agent 零成本消费              |
| Skills 不暴露给用户    | 保护核心知识产权，用户只感知对话接口                    |
| 只提取代码中存在的事实      | 不编造代码中不存在的历史                          |
| 索引不倾倒            | 路由、摘要、提取模式，不复制原文                      |
| 模式优先于日志          | 记录决策和约束，不是流水账                         |
| 不假装 Mature       | Scaffold 是骨架，Mature 必须通过真实回写生长        |
| `SKILL.md` 是黄金路径 | `references/` 和 `templates/` 是支撑，不是替代 |
| `en/` 为权威模板      | `zh/` 是人可读镜像，不替代主路由                   |
| pi SDK 不 fork    | 跟随上游更新，不维护分支                          |
| 配置优于代码           | 用户通过 edith.yaml 定制，不改代码               |

## SKILL.md 黄金路径（8 阶段）

按顺序执行，不跳过 stop condition，不将 scaffolding 呈现为 mature knowledge：

```text
1. CLARIFY        — 明确为什么需要 EDITH，选定第一个闭环
2. INVENTORY      — 盘点资产、仓库、流程（无文档时用 document-project 代码考古）
3. CLASSIFY       — 分为可自动生成 / 需人工确认 / 必须回写生长
4. SCAFFOLD       — 生成最小公司级骨架
5. BOOTSTRAP SKILLS — 生成最小技能集
6. CONFIRM        — 人工确认通过
7. PILOT-READY    — 声明试点就绪（非成熟）
8. GROW BY WRITEBACK — 通过真实工作回写成长
```

## 语言约定

* 产出物支持 `zh` / `en` 双语（由 `edith.yaml` 配置）

* 模板和参考文档维护 `en/` + `zh/` 镜像

* 代码和配置标识符保持英文

* 与用户沟通使用中文

⠀