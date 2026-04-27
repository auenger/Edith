# [CLAUDE.md](https://CLAUDE.md)

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

JARVIS 是组织的 AI 知识基础设施。本仓库 `create-jarvis-skill` 是构建 JARVIS 的元技能——帮助任何 Agent 为企业生成专属的 JARVIS 实例。

**当前阶段：Phase 1 — JARVIS Agent MVP**，基于 pi SDK (`@mariozechner/pi-coding-agent`) 构建终端 Agent。

**仓库性质：** 文档规范 + Agent 实现混合项目。`agent/` 为 TypeScript Agent 应用（有 package.json、构建系统、测试），根目录和 `jarvis-skills/` 以文档和规范为主。

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

* `agent/` — JARVIS Agent TypeScript 应用（`npm start` 启动）

  * `src/agent-startup.ts` — Agent 启动入口（配置加载 → Banner → Session → REPL 循环）

  * `src/extension.ts` — Extension 路由层（工具注册 + 命令注册）

  * `src/config.ts` — `jarvis.yaml` 配置加载与校验

  * `src/system-prompt.ts` — System Prompt 构建

  * `src/theme/` — TUI 品牌化（Banner、渐变色、状态栏）

  * `src/tools/` — jarvis_scan / jarvis_distill / jarvis_route 工具实现

  * `jarvis.yaml` — Agent 运行配置（LLM provider、workspace、token budget）

* `SKILL.md` — 黄金路径（8 阶段主流程），唯一权威执行路径

* `jarvis-skills/` — 三个运营 Skill（JARVIS Agent 的内部实现）

  * `document-project/` → `jarvis_scan` 工具（扫描项目代码，逆向生成文档）

  * `distillator/` → `jarvis_distill` 工具（蒸馏文档，生成三层知识产物）

  * `requirement-router/` → `jarvis_route` 工具（需求路由分析）

  * `INTEGRATION.md` — Skill 与 JARVIS 的融合方案

* `templates/en/` — 英文模板（权威），`templates/zh/` — 中文镜像

* `references/en/` — 英文参考文档，`references/zh/` — 中文参考

* `JARVIS-PRODUCT-DESIGN.md` — 产品设计文档（Agent / Board / Artifacts 三件套）

* `SCALABILITY-ANALYSIS.md` — 微服务规模下的瓶颈分析与三层加载设计

### Agent 架构分层

```text
用户 (自然语言对话)
  → TUI 层 (Banner + readline REPL + 主题渲染)
  → Extension 路由层 (消息拦截 + Skill 自动加载 + 工具注册)
  → Skill 执行层 (document-project / distillator / requirement-router)
  → Tool 实现层 (jarvis_scan / jarvis_distill / jarvis_route / jarvis_query)
  → pi SDK (AgentSession + 20+ LLM + Tool Calling + 流式输出)
  → 产出物 (纯 Markdown)
```

### 配置模型

用户通过 `jarvis.yaml` 定制（LLM provider、workspace 路径、repos 列表、token budget 等），不改代码。

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
| 配置优于代码           | 用户通过 jarvis.yaml 定制，不改代码              |

## SKILL.md 黄金路径（8 阶段）

按顺序执行，不跳过 stop condition，不将 scaffolding 呈现为 mature knowledge：

```text
1. CLARIFY        — 明确为什么需要 JARVIS，选定第一个闭环
2. INVENTORY      — 盘点资产、仓库、流程（无文档时用 document-project 代码考古）
3. CLASSIFY       — 分为可自动生成 / 需人工确认 / 必须回写生长
4. SCAFFOLD       — 生成最小公司级骨架
5. BOOTSTRAP SKILLS — 生成最小技能集
6. CONFIRM        — 人工确认通过
7. PILOT-READY    — 声明试点就绪（非成熟）
8. GROW BY WRITEBACK — 通过真实工作回写成长
```

## 语言约定

* 产出物支持 `zh` / `en` 双语（由 `jarvis.yaml` 配置）

* 模板和参考文档维护 `en/` + `zh/` 镜像

* 代码和配置标识符保持英文

* 与用户沟通使用中文

⠀