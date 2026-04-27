# Jarvis Skills — 老项目文档考古工具集

JARVIS 的分支 Skill，用于从无文档的老项目中逆向生成 AI 可消费的文档。填补 JARVIS 黄金路径 Phase 2 INVENTORY 阶段中"老项目无文档可盘点"的缺口。

## 三个 Skill

### 1. document-project — 项目文档生成器

`jarvis-skills/document-project/SKILL.md`

**功能**：扫描老项目代码，逆向生成全面文档。

**两种模式**：

* **全局扫描**：扫描整个项目，生成架构总览、API 契约、数据模型、业务逻辑等

* **模块深入**：对某个微服务/模块做逐文件详尽分析

**输出文件**：

```text
docs/
├── index.md                  # 主索引
├── project-overview.md        # 项目概览
├── tech-stack.md              # 技术栈
├── architecture.md            # 架构文档
├── source-tree.md             # 源码树
├── api-contracts.md           # API 契约
├── data-models.md             # 数据模型
├── business-logic.md          # 业务逻辑
├── development-guide.md       # 开发指南
└── deep-dive-{module}.md      # 模块深入
```

### 2. distillator — 文档蒸馏器

`jarvis-skills/distillator/SKILL.md`

**功能**：将大文档集无损压缩为 token 高效的精简版。是 JARVIS "索引不倾倒"原则的工具化实现。

**核心特点**：

* 无损压缩（不是摘要），压缩比 3:1+

* 支持语义拆分（按主题而非大小）

* 支持 JARVIS 技能蒸馏模式（`--jarvis-mode`）

* 支持速查卡模式（`--quick-ref`，压缩至 ~5%）

* 可选往返验证确认无损

### 3. requirement-router — 需求路由前置分析

`jarvis-skills/requirement-router/SKILL.md`

**功能**：判断用户需求是否需要加载 JARVIS 上下文，以及加载哪一层。是三层加载策略的决策入口。

**核心特点**：

* 只依赖 Layer 0 路由表做判断（<500 token）

* 四种路由决策：direct / quick-ref / multi-service / deep-dive

* 防止不必要的上下文加载

* 透明可追溯，每个决策都有理由

## 配合使用

```text
第一步：document-project 全局扫描
  ↓ 生成全套项目文档（可能很大）

第二步：distillator 蒸馏压缩
  ↓ 压缩为 Agent 可高效消费的精简版

第三步：distillator --quick-ref 生成速查卡
  ↓ 每个服务的快速参考卡（Layer 1）

第四步：日常使用 — requirement-router 需求路由
  ↓ 判断需求类型，决定加载策略
  ↓ direct：直接工作
  ↓ quick-ref：加载速查卡
  ↓ multi-service：加载多个速查卡
  ↓ deep-dive：加载具体蒸馏片段

结果：Agent 只在需要时加载需要的上下文
```

## 与 JARVIS 的关系

| 项    | 说明                                    |
| ---- | ------------------------------------- |
| 定位   | JARVIS 黄金路径 Phase 2 INVENTORY 的代码考古工具 |
| 依赖   | 无外部依赖，直接使用                            |
| 语言   | 中文为主                                  |
| 配置   | 启动时交互确认                               |
| 输出   | Scaffold（骨架），不假装是 Mature Knowledge    |
| 核心纪律 | 只提取代码中存在的事实，不编造代码中不存在的历史              |

## 关键纪律

> document-project 提取的是**代码中存在的事实**，不是代码中不存在的历史。\
> 从提取出的文档到成熟知识，必须走 JARVIS 的回写路径：\
> Scaffold → 人工确认 → 试点 → 回写 → Mature Knowledge

⠀