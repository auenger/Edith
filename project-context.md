---
last_updated: '2026-04-28'
version: 2
features_completed: 2
---

# Project Context: JARVIS

> AI 知识基础设施——让代码变成 AI 可消费知识的自主 Agent。本仓库 `create-jarvis-skill` 是构建 JARVIS 的元技能。

---

## Technology Stack

| Category | Technology | Notes |
|----------|-----------|-------|
| 核心产出物 | Markdown | 所有知识产物为纯 Markdown，Agent 无关 |
| Agent 框架 | pi SDK (`@mariozechner/pi-coding-agent`) v0.70+ | 不 fork，跟随上游 |
| Agent 应用 | TypeScript (`agent/`) | `@jarvis/agent` package，npm start 启动 |
| Extension | TypeScript | 消息路由 + 工具注册 |
| 技能定义 | SKILL.md (Markdown) | 知识提取逻辑，编译后分发 |
| 配置 | jarvis.yaml (YAML) | 用户定制，不改代码 |
| TUI | Node.js readline + ANSI true-color | Banner、渐变色、状态栏 |
| Web 看板 | React + Next.js | Phase 2，Board 只读 |
| 辅助脚本 | Python (`distillator/scripts/analyze_sources.py`) | 代码分析辅助 |

## Directory Structure

```text
HS_jarvis/
├── CLAUDE.md                  ← Claude Code 项目指令
├── SKILL.md                   ← 黄金路径（8 阶段主流程）
├── JARVIS-PRODUCT-DESIGN.md   ← 产品设计（Agent / Board / Artifacts）
├── SCALABILITY-ANALYSIS.md    ← 微服务规模瓶颈分析
├── README.md / README.zh.md   ← 项目说明
│
├── agent/                     ← JARVIS Agent TypeScript 应用
│   ├── src/
│   │   ├── index.ts           ← npm start 入口
│   │   ├── agent-startup.ts   ← Agent 初始化 + REPL 循环
│   │   ├── extension.ts       ← Extension 路由层
│   │   ├── config.ts          ← jarvis.yaml 配置加载
│   │   ├── system-prompt.ts   ← System Prompt 构建
│   │   ├── theme/             ← TUI 品牌化
│   │   ├── tools/             ← jarvis_scan / jarvis_distill / jarvis_route
│   │   └── bin/jarvis.ts      ← CLI 入口
│   ├── jarvis.yaml            ← Agent 运行配置
│   └── package.json           ← @jarvis/agent
│
├── jarvis-skills/             ← 三个运营 Skill（用户不可见）
│   ├── document-project/      ← jarvis_scan（代码考古→文档）
│   ├── distillator/           ← jarvis_distill（文档→三层知识）
│   ├── requirement-router/    ← jarvis_route（需求路由分析）
│   └── INTEGRATION.md         ← Skill 融合方案
│
├── templates/                 ← 模板（en/ 权威 + zh/ 镜像）
│   ├── en/                    ← 英文模板（25 个）
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
│   ├── commands/              ← dev-agent, run-feature
│   └── hooks/                 ← on-stop, on-subagent-complete
│
└── features/                  ← Feature 归档目录
```

## Critical Rules

### Must Follow

- **产出物永远是纯 Markdown** — 确保 Agent 无关性，任何 Agent 零成本消费
- **SKILL.md 是黄金路径** — 唯一权威执行路径，按 8 阶段顺序执行
- **`en/` 为权威模板** — `zh/` 是人可读镜像，不替代主路由
- **只提取代码中存在的事实** — 不编造代码中不存在的历史
- **配置优于代码** — 用户通过 jarvis.yaml 定制，不改代码
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
    → TUI 层 (Banner + readline REPL + 主题渲染)
    → Extension 路由层 (消息拦截 + Skill 自动加载 + 工具注册)
    → Skill 执行层 (document-project / distillator / requirement-router)
    → Tool 实现层 (jarvis_scan / jarvis_distill / jarvis_route / jarvis_query)
    → pi SDK (AgentSession + 20+ LLM + Tool Calling + 流式输出)
    → 产出物 (纯 Markdown)
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| 工具名 | snake_case, `jarvis_` 前缀 | `jarvis_scan`, `jarvis_distill` |
| Skill 目录 | kebab-case | `document-project/`, `requirement-router/` |
| 模板文件 | kebab-case | `routing-table.md`, `quick-ref-card.md` |
| 产出物 | kebab-case + 数字前缀 | `01-overview.md`, `02-api-contracts.md` |
| 配置文件 | snake_case.yaml | `jarvis.yaml` |
| Feature ID | `feat-` 前缀 + kebab-case | `feat-tool-scan`, `feat-board-scaffold` |

## Recent Changes

| Date | Feature | Notes |
|------|---------|-------|
| 2026-04-28 | fix-agent-repl | 修复 Agent 启动后立即退出：添加 readline REPL 交互循环 |
| 2026-04-27 | feat-packaging | Pi Package 打包与分发配置（CLI entry + post-install） |
| 2026-04-27 | feat-tui-branding | TUI 品牌化：Banner 渐变色、JARVIS 提示符、状态栏 |
| 2026-04-27 | feat-init-jarvis | JARVIS 知识基础设施项目初始化 |

## Product Phases

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | JARVIS Agent MVP（终端 Agent） | 开发中 |
| Phase 2 | JARVIS Board 基础版（Web 看板） | 待开发 |
| Phase 3 | 增值功能（增量更新、团队协作、行业模板） | 待规划 |

## Update Log

- 2026-04-28: Updated for agent REPL fix, agent/ directory documentation, tech stack update
- 2026-04-27: Initial project context created from full project analysis
