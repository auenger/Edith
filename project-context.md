---
last_updated: '2026-05-01'
version: 5
features_completed: 38
---

# Project Context: EDITH

> AI 知识基础设施——让代码变成 AI 可消费知识的自主 Agent。本仓库 `create-edith-skill` 是构建 EDITH 的元技能。

---

## Technology Stack

| Category | Technology | Notes |
|----------|-----------|-------|
| 核心产出物 | Markdown | 所有知识产物为纯 Markdown，Agent 无关 |
| Agent 框架 | pi SDK (`@mariozechner/pi-coding-agent`) v0.70+ | 不 fork，跟随上游 |
| Agent 应用 | TypeScript (`agent/`) | `@edith/agent` package，npm start 启动 |
| TUI | React + Ink | 组件化终端界面，16 个组件（含 ThinkingIndicator、types.ts、command-registry.ts） |
| Extension | TypeScript | 消息路由 + 工具注册 + 命令注册 + Skill 自动加载 |
| Context 监控 | context-monitor.ts | Token 计数 + 压力检测 + Cache 命中率（兼容非 Anthropic Provider 百分比回退） |
| 跨平台 | Node.js `process.platform` | Windows / macOS / Linux 路径与命令适配 |
| 技能定义 | SKILL.md (Markdown) | 知识提取逻辑，编译后分发 |
| 配置 | edith.yaml (YAML) | 多 Profile + 环境变量 + context_window + edith-init 向导 |
| LLM 接入 | 多协议统一 | DeepSeek / Xiaomi / Minimax / Zhipu / Moonshot / Ollama / Anthropic / 自定义协议 |
| E2E 测试 | e2e-pilot.ts | scan → distill → query → route 全流程验证 |
| Web 看板 | React + Next.js | Phase 2，Board 只读 |

## Directory Structure

```text
HS_jarvis/
├── CLAUDE.md                  ← Claude Code 项目指令
├── SKILL.md                   ← 黄金路径（8 阶段主流程）
├── EDITH-PRODUCT-DESIGN.md   ← 产品设计（Agent / Board / Artifacts）
├── SCALABILITY-ANALYSIS.md    ← 微服务规模瓶颈分析
├── project-context.md         ← 技术项目上下文（本文件）
├── README.md                  ← 项目说明
│
├── agent/                     ← EDITH Agent TypeScript 应用
│   ├── src/
│   │   ├── index.ts           ← npm start 入口
│   │   ├── agent-startup.ts   ← Agent 初始化 + Ink 渲染
│   │   ├── extension.ts       ← Extension 路由层（消息拦截 + Skill 自动加载 + 工具注册）
│   │   ├── config.ts          ← edith.yaml 配置加载 + Profile 管理 + edith-init 向导
│   │   ├── system-prompt.ts   ← System Prompt + Workspace Context 注入 + 平台信息
│   │   ├── context-monitor.ts ← Token 计数 + 压力检测 + Cache 命中率（百分比回退）
│   │   ├── query.ts           ← edith_query 工具（跨平台路径处理）
│   │   ├── shared-stats.ts    ← 跨组件共享状态
│   │   ├── e2e-pilot.ts       ← E2E Pilot 测试（scan → distill → query → route）
│   │   ├── agents/            ← Agent 定义（base / distill / explore .md prompts）
│   │   ├── theme/             ← TUI 品牌化（7 个文件）
│   │   │   ├── index.ts       ← 主题入口
│   │   │   ├── theme-config.ts← 主题配置
│   │   │   ├── color-engine.ts← 渐变色引擎
│   │   │   ├── banner.ts      ← Banner 渲染
│   │   │   ├── context-panel.ts← Context 面板
│   │   │   ├── subagent-panel.ts← SubAgent 面板
│   │   │   └── workspace-stats.ts← 工作区统计
│   │   ├── tools/             ← 工具实现（6 个）
│   │   │   ├── scan.ts        ← edith_scan（智能深度 + 函数级分析 + MD 挖掘）
│   │   │   ├── distill.ts     ← edith_distill（5 步压缩 + 冲突检测 + 验证）
│   │   │   ├── route.ts       ← edith_route（多服务路由 + 复杂度分析 + 紧急检测）
│   │   │   ├── index.ts       ← edith_index（便携式知识索引）
│   │   │   ├── explore.ts     ← edith_explore（项目浏览）
│   │   │   └── subagent.ts    ← 子代理（跨平台命令生成）
│   │   ├── tui/               ← React + Ink TUI 组件（16 个）
│   │   │   ├── App.tsx        ← 主应用组件
│   │   │   ├── BannerArea.tsx ← 欢迎横幅
│   │   │   ├── ContentArea.tsx← 消息内容区
│   │   │   ├── InputArea.tsx  ← 用户输入区
│   │   │   ├── StatusBarMetrics.tsx ← 状态栏指标
│   │   │   ├── ThinkingBlock.tsx    ← 截断预览式思考展示
│   │   │   ├── ThinkingIndicator.tsx← 思考动态指示器
│   │   │   ├── ToolCallBlock.tsx    ← Claude Code 风格 Tool Call 渲染
│   │   │   ├── MarkdownRenderer.tsx ← Markdown 渲染
│   │   │   ├── CodeBlock.tsx        ← 代码块渲染
│   │   │   ├── CommandPalette.tsx   ← 命令面板
│   │   │   ├── command-registry.ts  ← 9 个 Slash 命令注册
│   │   │   ├── WarningBar.tsx       ← 压力警告条
│   │   │   ├── types.ts            ← 消息/ToolCall/Thinking 类型定义 + Reducer
│   │   │   └── useAgentSession.ts   ← Session 管理 Hook（Profile 切换 + suppress）
│   │   ├── bin/edith.ts      ← CLI 入口（edith 命令）
│   │   ├── scripts/post-install.ts ← npm postinstall
│   │   └── __tests__/        ← 测试（query / route / system-prompt / theme）
│   ├── edith.yaml            ← Agent 运行配置
│   ├── package.json           ← @edith/agent v0.1.0
│   └── CHANGELOG.md           ← 版本变更日志
│
├── edith-skills/             ← 三个运营 Skill（用户不可见）
│   ├── document-project/      ← edith_scan（代码考古→文档）
│   ├── distillator/           ← edith_distill（文档→三层知识）
│   ├── requirement-router/    ← edith_route（需求路由分析）
│   └── INTEGRATION.md         ← Skill 融合方案
│
├── templates/                 ← 模板（en/ 权威 + zh/ 镜像）
│   ├── en/                    ← 英文模板
│   └── zh/                    ← 中文镜像
│
├── references/                ← 参考文档（en/ + zh/）
├── feature-workflow/          ← Feature 工作流配置
│   ├── config.yaml
│   ├── queue.yaml
│   └── templates/
│
├── .claude/                   ← Claude Code 技能与配置
│   ├── skills/                ← feature-workflow skills
│   └── commands/              ← dev-agent, run-feature
│
└── features/                  ← Feature 目录
    ├── archive/               ← 已完成归档（38 个）
    └── pending-*              ← 待开发（8 个 P2 特性 + workflow-orchestrator）
```

## Critical Rules

### Must Follow

- **产出物永远是纯 Markdown** — 确保 Agent 无关性，任何 Agent 零成本消费
- **SKILL.md 是黄金路径** — 唯一权威执行路径，按 8 阶段顺序执行
- **`en/` 为权威模板** — `zh/` 是人可读镜像，不替代主路由
- **只提取代码中存在的事实** — 不编造代码中不存在的历史
- **配置优于代码** — 用户通过 edith.yaml 定制，不改代码
- **索引不倾倒** — 路由、摘要、提取模式，不复制原文
- **模式优先于日志** — 记录决策和约束，不是流水账
- **不假装 Mature** — Scaffold 是骨架，Mature 必须通过真实回写生长
- **Skills 不暴露给用户** — 保护核心知识产权，用户只感知对话接口
- **pi SDK 不 fork** — 跟随上游更新，不维护分支

### Must Avoid

- 不要跳过 SKILL.md 中的 stop condition
- 不要将 scaffolding 呈现为 mature knowledge
- 不要让 Board 修改 Agent 产出物（Board 只读）
- 不要绑定特定 LLM 或 Agent 框架
- 不要复制原文到索引，只做语义压缩

## Architecture Pattern

```text
三层知识产物（核心数据模型）：

  Layer 0 — routing-table.md    (<500 token，常驻)
    全局服务路由表，Agent 读取后自动获得路由能力

  Layer 1 — quick-ref.md        (~5% 原文，每服务一张)
    验证命令、关键约束、易错点、API 端点速查

  Layer 2 — distillates/*.md    (无损压缩，按需加载)
    语义拆分的蒸馏片段：接口契约、数据模型、业务逻辑

消费方式：零适配。任何 AI Agent 只需能读 Markdown 即可。
```

```text
Agent 分层架构：

  用户 (自然语言)
    → TUI 层 (React + Ink 组件化, 16 组件)
      → BannerArea / ContentArea / StatusBarMetrics / InputArea
      → ThinkingBlock (截断预览) / ThinkingIndicator (动态指示) / ToolCallBlock (展开式渲染)
      → Slash 命令 (/model, /new, /clear, /compact, /context, /status, /delegate, /explore, /init)
    → Context Monitor (Token 计数 + 压力检测 + Cache 命中率, 兼容非 Anthropic Provider)
    → Extension 路由层 (消息拦截 + Skill 自动加载 + 工具注册 + 命令注册)
    → System Prompt (Workspace Context 注入 + routing-table Layer 0 + 平台信息)
    → Skill 执行层 (document-project / distillator / requirement-router)
    → Tool 实现层 (edith_scan / edith_distill / edith_route / edith_index / edith_query / edith_explore / subagent)
    → pi SDK (AgentSession + 多 LLM Provider + Tool Calling + 流式输出)
    → 产出物 (纯 Markdown)
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| 工具名 | snake_case, `edith_` 前缀 | `edith_scan`, `edith_distill`, `edith_explore`, `edith_index` |
| Skill 目录 | kebab-case | `document-project/`, `requirement-router/` |
| 模板文件 | kebab-case | `routing-table.md`, `quick-ref-card.md` |
| 产出物 | kebab-case + 数字前缀 | `01-overview.md`, `02-api-contracts.md` |
| 配置文件 | snake_case.yaml | `edith.yaml` |
| Feature ID | `feat-` 前缀 + kebab-case | `feat-tui-branding`, `feat-model-hot-switch` |

## Recent Changes

| Date | Feature | Notes |
|------|---------|-------|
| 2026-05-01 | feat-cross-platform-support | 跨平台兼容性（Windows / macOS / Linux）— path.join、平台感知 spawn、System Prompt 注入 |
| 2026-04-30 | feat-excavate-code-deep | 函数级代码深度分析 — 签名提取、依赖关系、设计模式识别 |
| 2026-04-30 | feat-excavate-md-mining | MD 文档分类分级挖掘 + 代码交叉验证 |
| 2026-04-30 | feat-excavate-smart-depth | 智能深度控制 — 按项目规模自动选择扫描深度 |
| 2026-04-30 | feat-ctx-monitor-fix | Context Monitor 非 Anthropic Provider 统计修复（百分比回退） |
| 2026-04-30 | feat-session-lifecycle | Session 生命周期命令修复 (/new, /clear, /compact) |
| 2026-04-29 | feat-knowledge-index-skill | edith_index 工具 — 生成便携式知识索引 |
| 2026-04-29 | feat-skill-align-route | Route 精准路由增强 — 多服务路由、复杂度分析、紧急事件检测 |
| 2026-04-29 | feat-skill-align-distill | Distill 无损压缩引擎 — 5 步流水线、冲突检测、验证 |
| 2026-04-29 | feat-skill-align-scan | Scan 深度代码考古 — 分类、API 契约、数据模型、业务逻辑 |
| 2026-04-29 | feat-multi-api-protocol | 多 API 协议 Provider 支持（OpenAI/Anthropic/Ollama/自定义） |
| 2026-04-29 | workspace-context-injection | System Prompt 自动注入 repos + routing-table (Layer 0) |
| 2026-04-29 | tui-rendering-improvements | ThinkingBlock 截断预览 + ThinkingIndicator + suppress 初始 prompt |
| 2026-04-28 | feat-tui-ctx-refresh | CTX 动态刷新 + Token 计数修复 |
| 2026-04-28 | feat-tui-tool-rendering | Claude Code 风格 Tool Call 展开式渲染 |
| 2026-04-28 | fix-agent-repl | 修复 Agent 启动后立即退出：添加 readline REPL 交互循环 |
| 2026-04-27 | feat-model-hot-switch | Config 热更新 — Model 持久化 + Scan 自动注册 Repo |
| 2026-04-27 | feat-openai-compatible-provider | 多 LLM Provider 配置化 + TUI 切换 + 状态栏显示 |
| 2026-04-27 | feat-tui-branding | TUI 品牌化：Banner 渐变色、EDITH 提示符、状态栏 |
| 2026-04-27 | feat-packaging | Pi Package 打包与分发配置（CLI entry + post-install） |
| 2026-04-27 | feat-init-edith | EDITH 知识基础设施项目初始化 |

## Product Phases

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | EDITH Agent MVP（终端 Agent） | **开发中** — 7 工具 + TUI 16 组件 + 跨平台支持，38 Feature 归档，进入 P2 规划阶段 |
| Phase 2 | EDITH Board 基础版（Web 看板） | 待开发 |
| Phase 3 | 增值功能（增量更新、团队协作、行业模板） | 待规划 |

## Update Log

- 2026-05-01: Updated for cross-platform support (Windows/macOS/Linux), added agents/, bin/, scripts/, __tests/, e2e-pilot.ts to directory structure, updated TUI to 16 components, updated tools to 6 files, updated slash commands to 9, updated feature count to 38 — 38 features completed
- 2026-04-30: Updated for smart depth scan, MD mining, function-level deep analysis, knowledge index, skill alignment (scan/route/distill), multi-API protocol, session lifecycle, ctx-monitor fix — 34 features completed
- 2026-04-29: Updated for workspace context injection, TUI rendering improvements, React+Ink TUI, context monitor, updated directory structure
- 2026-04-28: Updated for agent REPL fix, agent/ directory documentation, tech stack update
- 2026-04-27: Initial project context created from full project analysis
