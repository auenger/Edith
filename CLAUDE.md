# CLAUDE.md — HS_jarvis (create-jarvis-skill)

## 项目定位

JARVIS 是组织的 AI 知识基础设施。本仓库 `create-jarvis-skill` 是构建 JARVIS 的元技能（meta-skill）——帮助任何 Agent 为企业生成专属的 JARVIS 实例。

当前阶段：**Phase 1 — JARVIS Agent MVP**，基于 pi SDK (`@mariozechner/pi-coding-agent`) 构建终端 Agent。

## 仓库结构

```text
HS_jarvis/
├── SKILL.md                  ← 黄金路径（8 阶段主流程），唯一权威执行路径
├── JARVIS-PRODUCT-DESIGN.md  ← 产品设计文档（Agent / Board / Artifacts 三件套）
├── SCALABILITY-ANALYSIS.md   ← 微服务规模下的瓶颈分析与三层加载设计
├── README.md / README.zh.md  ← 项目说明
│
├── jarvis-skills/            ← 三个运营 Skill（JARVIS Agent 的内部实现）
│   ├── document-project/     ← 项目文档逆向生成器 → jarvis_scan 工具
│   ├── distillator/          ← 文档蒸馏器 → jarvis_distill 工具
│   ├── requirement-router/   ← 需求路由分析 → jarvis_route 工具
│   ├── INTEGRATION.md        ← 三个 Skill 与 JARVIS 的融合方案
│   └── README.md             ← Skill 集合说明
│
├── templates/                ← 模板文件（en/ + zh/ 双语镜像）
│   ├── en/                   ← 英文模板（权威）
│   └── zh/                   ← 中文模板（人可读镜像）
│
├── references/               ← 参考文档（en/ + zh/ 双语镜像）
│   ├── en/                   ← 英文参考（按需读取）
│   └── zh/                   ← 中文参考
│
└── BMAD-METHOD/              ← 第三方方法论参考，只读
```

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

## Phase 1 当前重点：JARVIS Agent

### 架构分层

```text
用户 (自然语言对话)
  → TUI 层 (JARVIS 品牌化界面)
  → Extension 路由层 (消息拦截 + Skill 自动加载 + 工具注册)
  → Skill 执行层 (document-project / distillator / requirement-router)
  → Tool 实现层 (jarvis_scan / jarvis_distill / jarvis_route / jarvis_query)
  → pi SDK (Agent Loop + 20+ LLM + Tool Calling + 流式输出)
  → 产出物 (纯 Markdown)
```

### 四个核心工具

| 工具 | 对应 Skill | 功能 |
|------|-----------|------|
| `jarvis_scan` | document-project | 扫描项目代码，逆向生成文档 |
| `jarvis_distill` | distillator | 蒸馏文档，生成三层知识产物 |
| `jarvis_route` | requirement-router | 需求路由分析，判断上下文加载策略 |
| `jarvis_query` | — (直接读文件) | 三层加载策略查询知识库 |

### 两种运行模式

- **生产模式**：`jarvis scan` / `jarvis distill` / `jarvis build-routing-table` — 自主工作，产出知识
- **问答模式**：`jarvis` 交互式对话 — 查询知识库、分析需求路由

### 配置模型：jarvis.yaml

```yaml
llm:
  provider: anthropic
  model: claude-sonnet-4-6
  api_key: ${ANTHROPIC_API_KEY}

workspace:
  root: ./company-jarvis
  language: zh          # zh | en

repos:
  - name: user-service
    path: /repos/user-service
    stack: spring-boot + postgresql

agent:
  token_budget:
    routing_table: 500
    quick_ref: 2000
    distillate_fragment: 1000
  auto_refresh: true
  refresh_interval: 24h
```

## 工作纪律

| 纪律 | 原因 |
|------|------|
| 产出物永远是纯 Markdown | Agent 无关性，任何 Agent 零成本消费 |
| Skills 不暴露给用户 | 保护核心知识产权，用户只感知对话接口 |
| 只提取代码中存在的事实 | 不编造代码中不存在的历史 |
| 索引不倾倒 | 路由、摘要、提取模式，不复制原文 |
| 模式优先于日志 | 记录决策和约束，不是流水账 |
| 不假装 Mature | Scaffold 是骨架，Mature 必须通过真实回写生长 |
| `SKILL.md` 是黄金路径 | `references/` 和 `templates/` 是支撑，不是替代 |
| `en/` 为权威模板 | `zh/` 是人可读镜像，不替代主路由 |
| pi SDK 不 fork | 跟随上游更新，不维护分支 |
| 配置优于代码 | 用户通过 jarvis.yaml 定制，不改代码 |

## SKILL.md 黄金路径（8 阶段）

```
1. CLARIFY        — 明确为什么需要 JARVIS，选定第一个闭环
2. INVENTORY      — 盘点资产、仓库、流程（无文档时用 document-project 代码考古）
3. CLASSIFY       — 分为可自动生成 / 需人工确认 / 必须回写生长
4. SCAFFOLD       — 生成最小公司级骨架
5. BOOTSTRAP SKILLS — 生成最小技能集
6. CONFIRM        — 人工确认通过
7. PILOT-READY    — 声明试点就绪（非成熟）
8. GROW BY WRITEBACK — 通过真实工作回写成长
```

## 后续阶段规划

- **Phase 2: JARVIS Board** — Web 看板（React + Next.js），只读展示知识库
- **Phase 3: 增值功能** — 增量更新、团队协作、行业模板、CI/CD 集成

## 语言约定

- 产出物支持 `zh` / `en` 双语（由 `jarvis.yaml` 配置）
- 模板和参考文档维护 `en/` + `zh/` 镜像
- 代码和配置标识符保持英文
- 与用户沟通使用中文
