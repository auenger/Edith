# EDITH — AI Knowledge Infrastructure

> 让代码变成 AI 可消费知识，产出物对所有 Agent 开放。

EDITH 是组织的 AI 知识基础设施。它从代码中提取知识，生成纯 Markdown 产出物，任何 AI Agent 无需安装、无需适配，直接消费。

## 产品矩阵

```text
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  EDITH Agent │    │  EDITH Board │    │  EDITH Artifacts │
│  (终端 Agent)  │    │  (Web 看板)    │    │  (开放产出物)      │
│              │    │              │    │                  │
│  对话式交互    │    │  可视化仪表盘  │    │  routing-table   │
│  知识生产     │    │  项目总览      │    │  quick-ref       │
│  知识查询     │    │  知识健康度    │    │  distillates     │
│  需求路由     │    │  服务图谱      │    │  decisions       │
│              │    │              │    │                  │
│  生产侧      │    │  展示侧       │    │  消费侧           │
└──────┬───────┘    └──────┬───────┘    └────────┬─────────┘
       │                   │                     │
       └───────────────────┼─────────────────────┘
                           │
                  ┌────────▼────────┐
                  │  知识仓库 (Git)   │
                  │  单一真相源       │
                  └─────────────────┘
```

## 核心原则

| 原则       | 含义                        |
| -------- | ------------------------- |
| 产出物开放    | 纯 Markdown，任何 Agent 原生可消费 |
| 生产侧封装    | 知识生产过程封装为 Agent，用户不感知内部实现 |
| 知识积累     | 随使用持续积累组织知识，越用越值钱         |
| Agent 无关 | 不绑定特定 LLM 或 Agent 框架      |

## 三层知识架构

```text
Layer 0 — routing-table.md    (<500 token，常驻)
  全局服务路由表，Agent 读取后自动获得路由能力

Layer 1 — quick-ref.md        (~5% 原文，每服务一张)
  验证命令、关键约束、易错点、API 端点速查

Layer 2 — distillates/*.md    (无损压缩，按需加载)
  语义拆分的蒸馏片段：接口契约、数据模型、业务逻辑
```

**消费方式：零适配。** 任何 AI Agent 只需能读 Markdown 文件即可。

```text
只需要：
  ✅ 能读 Markdown 文件
  ✅ 理解文件中的路由规则

不需要：
  ❌ 安装 EDITH
  ❌ 调用 EDITH API
  ❌ 适配任何协议
```

## Phase 1: EDITH Agent

基于 [pi SDK](https://github.com/nicholasgasior/pi-coding-agent) 的终端 Agent，两种运行模式：

**生产模式** — 自主工作，产出知识：

```bash
edith scan user-service        # 扫描代码 → 产出文档
edith distill user-service     # 蒸馏文档 → 三层知识产物
edith build-routing-table      # 从所有服务提取 → Layer 0 路由表
edith refresh user-service     # 检测代码变更 → 增量更新
```

**问答模式** — 交互式对话：

```bash
edith
EDITH> user-service 的认证流程是什么？
EDITH> 订单创建调用了哪些外部服务？
EDITH> 这个需求要加载上下文吗：给用户表加 phone 字段
```

### Agent 架构

```text
用户 (自然语言)
  → TUI 层 (React + Ink + EDITH 品牌化)
    → Banner / ContentArea / StatusBar / InputArea
    → Slash 命令 (/model, /new, /clear, /compact, /context, /delegate, /explore)
    → ThinkingBlock / ToolCallBlock 流式渲染
  → Extension 路由层 (消息拦截 + Skill 自动加载 + 工具注册)
  → Skill 执行层 (document-project / distillator / requirement-router)
  → Tool 实现层 (edith_scan / edith_distill / edith_route / edith_query / edith_explore / edith_index / subagent)
  → pi SDK (AgentSession + 多 LLM Provider + Tool Calling + 流式输出)
  → 产出物 (纯 Markdown)
```

### 已实现功能

| 功能                | 说明                                                                |
| ----------------- | ----------------------------------------------------------------- |
| 多 LLM Provider    | DeepSeek / Xiaomi MiMo / Anthropic / OpenAI / Ollama，`/model` 热切换 |
| TUI 品牌化           | Banner 渐变色、EDITH 提示符、状态栏                                          |
| Context Monitor   | Token 计数 + 压力检测 + Cache 命中率，实时显示                                  |
| Workspace Context | System Prompt 自动注入 repos + routing-table (Layer 0)                |
| Tool Call 渲染      | Claude Code 风格展开式 Tool Call 展示                                    |
| Thinking Block    | 截断预览式思考过程展示 + ThinkingIndicator 动态指示                          |
| Slash 命令          | /model /new /clear /compact /context /delegate /explore           |
| Sub-agent         | 子代理委派执行复杂任务（parallel / chain 模式）                               |
| Config 热更新        | Model 切换持久化 + Scan 自动注册 Repo                                      |
| Knowledge Index   | 便携式知识索引生成，供外部 Agent 路由消费                                         |
| Multi-API Protocol | OpenAI / Anthropic / Ollama / 自定义协议统一接入                            |
| Smart Depth Scan  | 按项目规模自动选择扫描深度（快速/标准/深度）                                        |
| MD Mining         | MD 文档分类分级挖掘 + 代码交叉验证                                             |
| Function-level Scan | 函数级深度分析：签名提取、依赖关系、设计模式识别                                      |
| Session Lifecycle | /new /clear /compact 命令完整修复，Session 状态管理                             |

## 仓库结构

```text
Edith/
├── CLAUDE.md                  ← 项目上下文入口
├── SKILL.md                   ← 黄金路径（8 阶段 EDITH 构建流程）
├── EDITH-PRODUCT-DESIGN.md   ← 产品设计文档
├── SCALABILITY-ANALYSIS.md    ← 微服务规模下的瓶颈分析
├── project-context.md         ← 技术项目上下文
│
├── agent/                     ← EDITH Agent TypeScript 应用
│   ├── src/
│   │   ├── index.ts           ← npm start 入口
│   │   ├── agent-startup.ts   ← Agent 初始化 + Ink 渲染
│   │   ├── extension.ts       ← Extension 路由层（工具 + 命令注册）
│   │   ├── config.ts          ← edith.yaml 配置加载 + Profile 管理
│   │   ├── system-prompt.ts   ← System Prompt 构建 + Workspace 注入
│   │   ├── context-monitor.ts ← Token 计数 + 压力检测 + Cache 命中率
│   │   ├── query.ts           ← edith_query 工具实现
│   │   ├── shared-stats.ts    ← 跨组件共享状态
│   │   ├── theme/             ← TUI 品牌化（Banner、渐变色、主题配置）
│   │   ├── tools/             ← edith_scan / edith_distill / edith_route / edith_index / edith_explore / subagent
│   │   ├── tui/               ← React + Ink TUI 组件
│   │   │   ├── App.tsx        ← 主应用组件
│   │   │   ├── BannerArea.tsx ← 欢迎横幅
│   │   │   ├── ContentArea.tsx← 消息内容区
│   │   │   ├── InputArea.tsx  ← 用户输入区
│   │   │   ├── StatusBarMetrics.tsx ← 状态栏指标
│   │   │   ├── ThinkingBlock.tsx    ← 思考过程展示
│   │   │   ├── ToolCallBlock.tsx    ← Tool Call 渲染
│   │   │   ├── ThinkingIndicator.tsx← 思考动态指示器
│   │   │   ├── MarkdownRenderer.tsx ← Markdown 渲染
│   │   │   ├── CodeBlock.tsx        ← 代码块渲染
│   │   │   ├── CommandPalette.tsx   ← 命令面板
│   │   │   ├── command-registry.ts  ← 命令注册表
│   │   │   ├── WarningBar.tsx       ← 压力警告条
│   │   │   ├── types.ts            ← 消息/ToolCall/Thinking 类型定义 + Reducer
│   │   │   └── useAgentSession.ts   ← Session 管理 Hook
│   │   └── bin/edith.ts      ← CLI 入口（edith 命令）
│   ├── edith.yaml            ← Agent 运行配置
│   └── package.json           ← @edith/agent
│
├── edith-skills/             ← 三个运营 Skill（Agent 内部实现）
│   ├── document-project/      ← 代码考古 → edith_scan
│   ├── distillator/           ← 文档蒸馏 → edith_distill
│   ├── requirement-router/    ← 需求路由 → edith_route
│   └── INTEGRATION.md         ← Skill 融合方案
│
├── templates/                 ← 模板（en/ + zh/ 双语）
├── references/                ← 参考文档（en/ + zh/ 双语）
├── feature-workflow/          ← Feature 工作流配置
│   ├── config.yaml
│   ├── queue.yaml
│   └── templates/
│
├── .claude/                   ← Claude Code 技能与配置
│   ├── skills/                ← feature-workflow skills
│   └── commands/              ← dev-agent, run-feature
│
└── features/                  ← Feature 归档目录
```

## EDITH 构建黄金路径

`SKILL.md` 定义了 8 阶段的唯一权威执行路径：

```text
1. CLARIFY          — 明确为什么需要 EDITH，选定第一个闭环
2. INVENTORY        — 盘点资产、仓库、流程
3. CLASSIFY         — 分为可自动生成 / 需人工确认 / 必须回写生长
4. SCAFFOLD         — 生成最小公司级骨架
5. BOOTSTRAP SKILLS — 生成最小技能集
6. CONFIRM          — 人工确认通过
7. PILOT-READY      — 声明试点就绪（非成熟）
8. GROW BY WRITEBACK — 通过真实工作回写成长
```

## 技术栈

| 组件              | 技术                                       | 说明                                                   |
| --------------- | ---------------------------------------- | ---------------------------------------------------- |
| Agent 框架        | pi SDK (`@mariozechner/pi-coding-agent`) | AgentSession + Tool Calling + 流式输出                   |
| TUI             | React + Ink                              | 组件化终端界面                                              |
| LLM 层           | 多协议统一接入                                  | DeepSeek / Xiaomi MiMo / Anthropic / OpenAI / Ollama / 自定义 |
| 扩展层             | TypeScript Extension                     | 消息路由 + 工具注册 + 命令注册                                    |
| 技能层             | Markdown SKILL.md                        | 知识提取逻辑                                               |
| 配置              | edith.yaml (YAML)                        | 多 Profile + 环境变量 + context_window                    |
| Context 监控      | context-monitor.ts                       | Token 计数 + 压力等级 + Cache 命中率（兼容非 Anthropic Provider） |
| Board (Phase 2) | React + Next.js                          | Web 看板                                               |

## 开发路线图

| 阶段      | 内容                             | 状态      |
| ------- | ------------------------------ | ------- |
| Phase 1 | EDITH Agent MVP — 终端对话式知识生产    | **开发中** — 核心框架 + 6 工具 + TUI 已完成，34 个 Feature 已归档 |
| Phase 2 | EDITH Board — Web 看板，知识可视化与管理  | 待开发     |
| Phase 3 | 增值功能 — 增量更新、团队协作、行业模板、CI/CD 集成 | 待规划     |

## 工作纪律

| 纪律               | 原因                             |
| ---------------- | ------------------------------ |
| 产出物永远是纯 Markdown | Agent 无关性，零成本消费                |
| Skills 不暴露给用户    | 保护核心知识产权                       |
| 只提取代码中存在的事实      | 不编造不存在的历史                      |
| 索引不倾倒            | 路由、摘要、提取模式，不复制原文               |
| 不假装 Mature       | Scaffold 是骨架，Mature 必须通过真实回写生长 |
| 配置优于代码           | 用户通过 edith.yaml 定制，不改代码        |
| `en/` 为权威模板      | `zh/` 是人可读镜像，不替代主路由            |
| pi SDK 不 fork    | 跟随上游更新，不维护分支                   |

## 许可说明

© 2026 yzw. All rights reserved.

Contact: <yzw@imcoders.net>

⠀