# EDITH — AI 知识基础设施

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
  → TUI 层 (EDITH 品牌化界面)
  → Extension 路由层 (消息拦截 + Skill 自动加载 + 工具注册)
  → Skill 执行层 (document-project / distillator / requirement-router)
  → Tool 实现层 (edith_scan / edith_distill / edith_route / edith_query)
  → pi SDK (Agent Loop + 20+ LLM + Tool Calling + 流式输出)
  → 产出物 (纯 Markdown)
```

## 仓库结构

```text
Edith/
├── CLAUDE.md                  ← 项目上下文入口
├── SKILL.md                   ← 黄金路径（8 阶段 EDITH 构建流程）
├── EDITH-PRODUCT-DESIGN.md   ← 产品设计文档
├── SCALABILITY-ANALYSIS.md    ← 微服务规模下的瓶颈分析
│
├── edith-skills/             ← 三个运营 Skill（Agent 内部实现）
│   ├── document-project/      ← 代码考古 → edith_scan
│   ├── distillator/           ← 文档蒸馏 → edith_distill
│   ├── requirement-router/    ← 需求路由 → edith_route
│   └── INTEGRATION.md         ← Skill 融合方案
│
├── templates/                 ← 模板（en/ + zh/ 双语）
├── references/                ← 参考文档（en/ + zh/ 双语）
└── edith.yaml                ← Agent 配置（用户定制）
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

| 组件              | 技术                   | 说明                              |
| --------------- | -------------------- | ------------------------------- |
| Agent 框架        | pi SDK               | Agent Loop + TUI + Tool Calling |
| LLM 层           | pi AI                | 20+ Provider 统一 API             |
| 扩展层             | TypeScript Extension | 消息路由 + 工具注册                     |
| 技能层             | Markdown SKILL.md    | 知识提取逻辑                          |
| 配置              | YAML                 | edith.yaml                      |
| Board (Phase 2) | React + Next.js      | Web 看板                          |

## 开发路线图

| 阶段      | 内容                             | 周期    |
| ------- | ------------------------------ | ----- |
| Phase 1 | EDITH Agent MVP — 终端对话式知识生产    | 2-3 周 |
| Phase 2 | EDITH Board — Web 看板，知识可视化与管理  | 3-4 周 |
| Phase 3 | 增值功能 — 增量更新、团队协作、行业模板、CI/CD 集成 | 持续迭代  |

## 工作纪律

| 纪律               | 原因                             |
| ---------------- | ------------------------------ |
| 产出物永远是纯 Markdown | Agent 无关性，零成本消费                |
| Skills 不暴露给用户    | 保护核心知识产权                       |
| 只提取代码中存在的事实      | 不编造不存在的历史                      |
| 索引不倾倒            | 路由、摘要、提取模式，不复制原文               |
| 不假装 Mature       | Scaffold 是骨架，Mature 必须通过真实回写生长 |
| 配置优于代码           | 用户通过 edith.yaml 定制，不改代码        |

## 许可说明

© 2026 yzw。保留所有权利。

联系方式：yzw@imcoders.net

⠀