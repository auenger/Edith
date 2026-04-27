# JARVIS 可扩展性分析 — 微服务规模下的瓶颈与设计方向

> 分析日期：2026-04-27\
> 实施日期：2026-04-27\
> 背景：当公司微服务数量增多时，JARVIS 在代码参与和上下文加载两方面暴露结构性瓶颈

***

## 一、两个核心问题

### 问题 1：JARVIS 不应该直接参与每个微服务的代码编写

JARVIS 的三层技能（Source → Repo → Workflow）本质是**路由和协调层**，它擅长的是：

* 告诉 Agent "去哪个仓库、读什么文件、按什么流程做"

* 跨仓库的业务编排（Workflow Skill）

* 知识的沉淀和回写

但 JARVIS **没有定义** Agent 在单个仓库内"怎么写代码"。Repo Skill 只回答"我在哪、怎么验证"，不负责"帮我实现这个功能"。

当微服务变多时的三个压力点：

| 压力点  | 具体表现                                               |
| ---- | -------------------------------------------------- |
| 认知负担 | 每个 Repo Skill 要维护，Agent 每次都要先读 Skill 再写代码，上下文切换成本高 |
| 质量一致 | 不同微服务的代码风格、架构模式、错误处理方式难以统一                         |
| 重复劳动 | CRUD、路由定义、数据模型、测试脚手架...每个微服务都要重复一遍                 |

### 问题 2：新需求每次都走 JARVIS 思考路径，导致过量上下文加载

```text
当前路径：
  新需求 → 加载 JARVIS Entry Skill → 路由到 Repo Skill → 读文档 → 再开始干活

实际痛点：
  - Entry Skill 本身就很大（所有微服务的路由表）
  - Repo Skill 包含了完整仓库知识（大部分跟当前需求无关）
  - 如果跨服务改动，要加载多个 Repo Skill
  - 每次都走"思考路径"，成本高、速度慢
```

核心矛盾：**JARVIS 是为 Agent 的全局认知设计的，但实际开发 90% 的时间只需要局部知识。**

***

## 二、JARVIS 当前设计的隐含假设与缺口

### 隐含假设

JARVIS 假设每个任务都需要先建立全局认知再动手。这在"新人接手老项目"场景下是对的，但在日常开发中是浪费。

### 能力缺口

| 层次    | JARVIS 已有的                 | 缺的              |
| ----- | -------------------------- | --------------- |
| 路由    | Workflow Skill 可以编排跨仓库任务   | —               |
| 仓库操作  | Repo Skill 告诉 Agent "怎么验证" | 没有"怎么生成代码"的指导   |
| 代码产出  | 完全靠 Agent 自己理解代码后写         | 没有模板、脚手架、代码生成机制 |
| 上下文加载 | Repo Skill 是整篇文档           | 没有分层加载策略，全量进出   |

***

## 三、什么样的任务需要 JARVIS？

| 场景              | 需要 JARVIS？ | 原因                    |
| --------------- | ---------- | --------------------- |
| 新人接手老项目         | 需要         | 没有上下文，必须靠 JARVIS 建立认知 |
| 跨 3+ 微服务的改动     | 需要         | 需要协调，Agent 自己搞不清依赖    |
| 单个微服务的小功能       | **不需要**    | 直接看代码比读 JARVIS 文档更快   |
| 重复性工作（CRUD、加字段） | **不需要**    | 应该用模板/脚手架解决           |
| 线上事故排查          | 需要但紧急      | 需要快速路由到对的仓库和人         |
| 日常小需求           | **不需要**    | Agent 直接在代码中工作更高效     |

**结论：JARVIS 应该是"按需查询"而不是"必经之路"。**

***

## 四、设计方案（已实施）

### 方案 1：JARVIS 职责边界收缩

```text
JARVIS 应该做的：
  ✅ 知道有哪些微服务
  ✅ 知道微服务之间的调用关系和依赖
  ✅ 知道每个微服务的接口契约
  ✅ 能路由 Agent 到正确的仓库
  ✅ 跨仓库变更的协调和编排
  ✅ 组织知识的沉淀和回写

JARVIS 不应该做的：
  ❌ 直接参与代码生成
  ❌ 替代 IDE 和开发工具
  ❌ 每个任务都强制加载
  ❌ 成为日常开发的必经瓶颈
```

### 方案 2：三层加载策略（已实施）

将 JARVIS 的知识分为三个加载层次，按需取用：

```text
Layer 0 — 路由表（常驻, <500 token）
  存储：<company>-jarvis/skills/<company-jarvis>/routing-table.md
  内容：服务 → 一句话定位 + 技术栈 + Owner + 关键约束
  时机：每次对话自动加载，1 秒读完即知涉及哪些服务
  模板：templates/en/routing-table.md, templates/zh/routing-table.md

Layer 1 — 速查卡（按需, <2000 token）
  存储：<company>-jarvis/skills/<repo-skill>/quick-ref.md
  内容：验证命令 + Top 5 约束 + Top 5 易错点 + 接口清单摘要 + 数据模型摘要
  时机：任务进入某个微服务时加载
  模板：templates/en/quick-ref-card.md, templates/zh/quick-ref-card.md
  生成：distillator --quick-ref

Layer 2 — 蒸馏片段（深入, <1000 token/片段）
  存储：<company>-jarvis/distillates/<repo-name>/01-topic.md
  内容：完整接口契约、数据模型、业务逻辑等自包含片段
  时机：实现具体功能时按片段加载
  生成：distillator（现有功能，按主题语义拆分）
```

**运行时加载流程**：

```text
Agent 启动任务
  ↓
Layer 0 路由表（常驻上下文）
  → 确定涉及哪些服务
  ↓
加载 Layer 1 速查卡（1 个服务 = 1 次加载）
  → 知道验证命令、约束、易错点
  ↓ 还不够？
加载 Layer 2 蒸馏片段（按需）
  → 查具体接口契约、数据模型细节
  ↓
开始工作
```

**关键变化：JARVIS 从"前置必经"变成"途中按需查询"。**

### 方案 3：distillator 速查卡模式（已实施）

当前 distillator 只有"完整蒸馏版"一个输出级别。新增 `--quick-ref` 参数：

```text
完整文档（原始）         100%    原始项目文档
  ↓ distillator（现有）
蒸馏版                   ~30%    全景参考，保留所有信号
  ↓ distillator --quick-ref（新增）
速查卡                   ~5%     只留：验证命令 + 约束 + 易错点

  ↓ distillator --jarvis-mode=repo-skill（现有）
JARVIS Repo Skill 蒸馏版  ~15%   Agent 操作仓库需要的信息
```

**--quick-ref 与 --jarvis-mode 正交组合**：

| 命令                                                           | 输出                          |
| ------------------------------------------------------------ | --------------------------- |
| `distillator source.md`                                      | 完整蒸馏版（~30%）                 |
| `distillator --quick-ref source.md`                          | 通用速查卡（~5%）                  |
| `distillator --jarvis-mode=repo-skill source.md`             | Repo Skill 蒸馏版（~15%）        |
| `distillator --quick-ref --jarvis-mode=repo-skill source.md` | Repo Skill 速查卡（~5%，偏向接口和验证） |

速查卡使用固定结构（不按主题分组）：

```text
Verify        — 精确的构建/测试/运行/lint 命令
Key Constraints — Top 5 硬约束
Pitfalls      — Top 5 易错点（"症状 — 原因"）
API Endpoints — Method / Path / Purpose 三列表，每行一句话
Data Models   — 每模型一行（名称 + 用途 + 2-3 关键字段）
Deep Dive     — 指向完整蒸馏版分片的路径
```

四种输出的定位对比：

| 输出                | 大小   | 用途          | 包含             | 不包含                |
| ----------------- | ---- | ----------- | -------------- | ------------------ |
| 蒸馏版               | ~30% | 新人理解项目、架构设计 | 所有信号、决策、约束     | 冗余、修辞、过渡语          |
| 速查卡               | ~5%  | 日常开发快速参考    | 关键约束、验证命令、易错点  | 完整接口清单、数据模型细节、设计决策 |
| JARVIS Repo Skill | ~15% | Agent 操作仓库  | 接口契约、数据模型、构建命令 | 环境搭建、迁移历史、所有 TODO  |
| 路由表               | <1%  | 常驻路由        | 服务名、定位、Owner   | 所有详细信息             |

### 方案 4：Entry Skill 极致轻量化（已实施）

Entry Skill 保持不变（工作流指导），新增独立的路由表文件：

```text
skills/<company-jarvis>/
├── SKILL.md           # 原有 Entry Skill（工作流：START → WORK → END）
└── routing-table.md   # 新增 Layer 0 路由表（<500 token，纯数据）
```

路由表内容格式：

| Service       | Role | Stack                       | Owner     | Key Constraints |
| ------------- | ---- | --------------------------- | --------- | --------------- |
| user-service  | 用户中心 | Spring Boot + PostgreSQL    | @zhangsan | 禁止直连数据库         |
| order-service | 订单处理 | Spring Boot + Redis + Kafka | @lisi     | 订单号全局唯一         |

同时包含速查路径映射：

| Service      | Quick-Ref (Layer 1)                | Full Skill (Layer 2)           |
| ------------ | ---------------------------------- | ------------------------------ |
| user-service | `skills/user-service/quick-ref.md` | `skills/user-service/SKILL.md` |

**超过 500 token 时按域拆分**：元路由表 → 按域子表。

### 方案 5：模板驱动的代码生成（长期，未实施）

对于标准化微服务，用模板替代 JARVIS 的直接参与：

```text
新增微服务时：
  1. JARVIS 路由到正确的项目模板（Workflow Skill）
  2. 模板生成项目骨架（代码脚手架）
  3. Agent 只需填充业务逻辑
  4. Repo Skill 由模板自动生成
```

这适合公司微服务架构统一的场景（如都是 Spring Boot + gRPC），需要先投入做模板。

***

## 五、实例目录结构（已实施）

```text
<company>-jarvis/
├── README.md
├── MAINTENANCE.md
├── modules/
│   ├── <module-a>/
│   │   ├── overview.md
│   │   ├── known-issues.md
│   │   ├── decisions.md
│   │   ├── rejected-features.md
│   │   └── test-coverage.md
│   └── <module-b>/
│       └── ...
├── sources/
│   ├── <source-a>/
│   │   └── README.md
│   └── <source-b>/
│       └── README.md
├── cross-cutting/
│   ├── module-interactions.md
│   └── version-changelog.md
├── tools/
│   ├── README.md
│   └── <scripts or manuals>
├── skills/
│   ├── <company-jarvis>/
│   │   ├── SKILL.md              # 入口技能（工作流）
│   │   └── routing-table.md      # Layer 0 路由表（<500 token，常驻）
│   ├── <repo-a>/
│   │   ├── SKILL.md              # 完整 Repo Skill（Layer 2 参考）
│   │   └── quick-ref.md          # Layer 1 速查卡（<2000 token）
│   └── <repo-b>/
│       ├── SKILL.md
│       └── quick-ref.md
├── distillates/
│   ├── <repo-a>/                 # Layer 2 蒸馏片段
│   │   ├── _index.md
│   │   ├── 01-overview.md
│   │   ├── 02-api-contracts.md
│   │   ├── 03-data-models.md
│   │   └── 04-business-logic.md
│   └── <repo-b>/
│       ├── _index.md
│       └── ...
└── _raw/ or _exports/
    ├── README.md
    └── <optional snapshots>
```

***

## 六、已实施的文件变更清单

### 新建文件（5 个）

| 文件                                         | 用途                | 状态    |
| ------------------------------------------ | ----------------- | ----- |
| `templates/en/routing-table.md`            | Layer 0 路由表模板（EN） | ✅ 已创建 |
| `templates/en/quick-ref-card.md`           | Layer 1 速查卡模板（EN） | ✅ 已创建 |
| `templates/zh/routing-table.md`            | Layer 0 路由表模板（ZH） | ✅ 已创建 |
| `templates/zh/quick-ref-card.md`           | Layer 1 速查卡模板（ZH） | ✅ 已创建 |
| `distillator/resources/quick-ref-rules.md` | 速查卡专用压缩规则         | ✅ 已创建 |

### 修改文件（4 个）

| 文件                                       | 变更内容                                      | 状态    |
| ---------------------------------------- | ----------------------------------------- | ----- |
| `distillator/SKILL.md`                   | 新增 `--quick-ref` 参数、输出格式、场景 4+5           | ✅ 已修改 |
| `distillator/scripts/analyze_sources.py` | 新增 `quick_ref_prediction` 到输出 JSON        | ✅ 已修改 |
| `templates/en/instance-skeleton.md`      | 新增 routing-table、quick-ref、distillates 目录 | ✅ 已修改 |
| `templates/zh/instance-skeleton.md`      | 同上中文版                                     | ✅ 已修改 |

### 未修改（设计约束）

| 文件                   | 原因                |
| -------------------- | ----------------- |
| `SKILL.md`（主 JARVIS） | 核心黄金路径不变，所有扩展为增量式 |

### 验证结果

* `analyze_sources.py` 语法检查通过

* `--help` 输出正常

* `quick_ref_prediction` 字段正确输出到 JSON

* 新文件无 BMAD 引用

* 主 SKILL.md 零改动

***

## 七、迁移路径

### 阶段 1：模板和 distillator 扩展（已完成 ✅）

模板文件和 distillator 扩展已就绪，可用于生成三层产物。

### 阶段 2：生成 Layer 0 路由表（每个公司一次）

从 repo inventory 和 Repo Skill 中提取服务信息，生成路由表：

```bash
distillator --quick-ref repo-inventory.md + existing repo skills
  → skills/<company-jarvis>/routing-table.md
```

### 阶段 3：生成 Layer 1 速查卡（每个 Repo 一次）

从已有蒸馏版或 Repo Skill 完整文档生成速查卡：

```bash
distillator --quick-ref --jarvis-mode=repo-skill distillates/<repo>/
  → skills/<repo-skill>/quick-ref.md
```

### 阶段 4：Layer 2 已就绪

现有蒸馏版拆分输出已服务于 Layer 2。`_index.md` 提供片段导航，按需加载。

***

## 八、完整使用流程

### 场景：用真实老项目验证三层加载

```text
1. document-project 全局扫描
   → 全套项目文档（可能很大）

2. distillator --jarvis-mode=repo-skill
   → 蒸馏版按主题拆分（Layer 2 就绪）

3. distillator --quick-ref --jarvis-mode=repo-skill
   → 每个服务的速查卡（Layer 1 就绪）

4. 从速查卡提取路由信息
   → 路由表（Layer 0 就绪）

5. 日常使用：
   Agent 启动 → 读路由表（<500 token）
   → 进入某服务 → 读速查卡（<2000 token）
   → 需要细节 → 读蒸馏片段（<1000 token）
```

### 场景：日常小需求

```text
Agent 直接在代码中工作（不加载 JARVIS）
  ↓ 卡住了？
查路由表 → 加载速查卡 → 解决
```

### 场景：跨服务改动

```text
查路由表 → 确定涉及 N 个服务
  → 加载 N 个速查卡（共 N×2000 token）
  → 对具体接口加载对应蒸馏片段
  → 完成工作后回写
```

***

## 九、待办事项

### 高优先级（已实施 ✅）

1. ~~速查卡格式定义~~ — ✅ `templates/quick-ref-card.md`

2. ~~路由表模板~~ — ✅ `templates/routing-table.md`

3. ~~distillator --quick-ref~~ — ✅ SKILL.md + quick-ref-rules.md

4. ~~需求路由前置分析~~ — ✅ `jarvis-skills/requirement-router/SKILL.md`

### 中优先级（待做）

5. **路由表超限自动拆分** — 当服务超过 500 token 时按域拆分

### 长期（待做）

6. **项目模板系统** — 标准化微服务的代码脚手架

7. **自动生成 Repo Skill** — 从模板自动产出 Repo Skill Stub

***

## 十、需求路由前置分析（requirement-router）

### 定位

在三层加载策略之前，用最小成本（仅 Layer 0 路由表）判断需求是否需要加载额外上下文。

### 四种路由决策

| 决策              | 含义    | 加载内容                 | 典型场景              |
| --------------- | ----- | -------------------- | ----------------- |
| `direct`        | 直接工作  | 无额外加载                | 单服务 CRUD、新增微服务    |
| `quick-ref`     | 加载速查卡 | 1 个 Layer 1          | 改接口、重构、事故排查       |
| `multi-service` | 多服务加载 | N 个 Layer 1          | 跨服务联调、数据同步        |
| `deep-dive`     | 深入查询  | Layer 1 + Layer 2 片段 | 改接口 Schema、数据模型变更 |

### 判断规则

基于三个信号做决策：

1. **服务名匹配**：需求中是否提到路由表中的服务名（0/1/2+个）

2. **动作类型**：crud / api-change / cross-service / new-service / incident / refactor

3. **复杂度信号**：涉及多实体、需协调、有前置依赖、影响兼容性

### 输出格式

```yaml
decision: direct | quick-ref | multi-service | deep-dive
services:
  - name: <service-name>
    layer: 0 | 1 | 2
    reason: "<为什么需要加载>"
    load: "<文件路径>"
confidence: high | medium | low
suggestion: "<一句话建议>"
```

### 实施文件

* `jarvis-skills/requirement-router/SKILL.md` — Skill 定义（已创建）

***

## 十、关键纪律

这个优化方向与 JARVIS 原有理念完全一致，只是将其延伸到上下文管理领域：

| JARVIS 原有原则 | 在上下文管理中的对应             |
| ----------- | ---------------------- |
| 索引不倾倒       | 按需加载，不全量推送             |
| 模式优先于日志     | 速查卡只留模式（约束、易错），不留过程    |
| 仓库真相留在仓库    | 详细知识留在蒸馏版，速查卡只是索引      |
| Pilot-First | 先在 1-2 个微服务上验证分层加载，再推广 |

**不是否定 JARVIS，而是让 JARVIS 在规模增长时依然轻量可用。**

⠀