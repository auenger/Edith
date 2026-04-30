---
name: edith-document-project
description: EDITH 分支 Skill。为无文档的老项目（棕色地带项目）生成 AI 可消费的文档骨架。扫描代码提取业务模型、接口信息、数据架构、技术栈等。填补 EDITH INVENTORY 阶段中"老项目无文档可盘点"的缺口。支持全局扫描和模块深入两种模式。
---

# Edith Document Project — 老项目文档考古工具

EDITH 的分支 Skill，填补黄金路径 Phase 2 INVENTORY 阶段的核心缺口：**公司有老项目但没有文档，Agent 无从盘点**。本 Skill 从代码本身逆向提取信息，让无文档的老项目也能被 EDITH 纳入盘点。

## 在 EDITH 中的定位

```
EDITH 黄金路径：
  Phase 1  CLARIFY           → 明确为什么需要 EDITH
  Phase 2  INVENTORY         → 盘点资产、仓库、流程
             ├─ 2a. 盘点已有文档和数字资产（原流程）
             ├─ 2b. 对无文档老项目运行本 Skill（代码考古）  ← 你在这里
             └─ 2c. 蒸馏压缩后生成技能种子（→ distillator）
  Phase 3  CLASSIFY          → 分类哪些可以自动生成
  Phase 4  SCAFFOLD          → 生成骨架
  Phase 5  BOOTSTRAP SKILLS  → 生成技能骨架
  Phase 6  CONFIRM           → 人工确认
  Phase 7  PILOT-READY       → 试点就绪
  Phase 8  GROW BY WRITEBACK → 通过回写成长
```

**本 Skill 的产出 → EDITH 三层技能的种子**：

| 本 Skill 的输出 | 对应的 EDITH 技能层 | 用途 |
|---|---|---|
| API 契约 + 数据模型 | Repo Skill | Agent 需要知道仓库暴露了什么接口和数据结构 |
| 业务逻辑 + 集成架构 | Workflow Skill | 从 Service 调用链反推跨仓库业务流程 |
| 项目概览 + 技术栈 | Source Skill | 帮助 Agent 路由到正确的仓库 |
| 源码树 + 开发指南 | Repo Skill | "我在哪？这个仓库干什么？怎么验证？" |
| 模块深入文档 | Repo Skill 完整版 | 逐文件级别的操作指南 |

## 核心原则

1. **代码即真相** — 当文档和代码冲突时，以代码为准
2. **边扫描边写入** — 每完成一个模块立即写入磁盘，不堆积在内存中
3. **只索引不倾倒** — 提取模式和结构，不是复制源码（与 EDITH 理念一致）
4. **模式优先于日志** — 记录反复出现的模式，不是流水账（与 EDITH 理念一致）
5. **禁止伪造** — 不确定的内容标注 `[未确认]`，绝不编造

## Scaffold 边界纪律

本 Skill 生成的是 **Scaffold（骨架）**，不是 **Mature Knowledge（成熟知识）**。

这是本 Skill 与 EDITH 理念对齐的**核心纪律**：

### 可以提取（代码中存在的事实）

- 接口签名、数据结构、路由定义
- 配置文件中的技术栈、版本、依赖
- 代码注释中明确写的 TODO/FIXME
- 目录结构反映的架构模式
- 方法调用链反映的业务流程骨架

### 禁止生成（代码中不存在的历史）

- "为什么当初选了这个方案" → 留给 EDITH 回写
- "已知的坑和踩过的雷" → 留给 EDITH 回写
- "被拒绝的设计方案" → 留给 EDITH 回写
- 成熟的 Repo Skill 操作指南 → 只能生成 Stub，成熟度靠回写

### 成熟度路径

```
本 Skill 的产出（Scaffold）
  ↓ EDITH Phase 6: 人工确认事实字段
  ↓ EDITH Phase 7: 试点就绪
  ↓ EDITH Phase 8: 真实工作中 START → WORK → END 回写
  ↓
Mature Knowledge（EDITH 的组织记忆）
```

**绝对不要把 Scaffold 当作 Mature Knowledge 交付。**

## 使用场景

- 老项目缺少文档，EDITH INVENTORY 阶段需要盘点
- 新团队成员或 AI Agent 需要快速理解项目
- 准备对老项目做改造或迁移前摸底
- 微服务架构需要梳理各服务边界和接口契约
- 为 EDITH 的 Repo Skill / Workflow Skill 生成初始 Stub

---

## 触发方式

当用户说：
- "帮我文档化这个项目"
- "扫描这个老项目"
- "分析这个微服务的接口和数据模型"
- "生成项目文档"

---

## 启动流程

### 1. 确定扫描目标

向用户确认：
- **项目路径**：要扫描的项目根目录
- **输出路径**：文档生成到哪里（默认：`{项目路径}/docs/`）
- **扫描模式**：
  - **全局扫描**（推荐首次使用）：扫描整个项目，生成架构总览、API 契约、数据模型等
  - **模块深入**：对某个微服务/模块做逐文件的详尽分析

### 2. MD 文档深度挖掘

将项目中已有的 MD 文档从"补充信息"提升为"一等知识源"，按分级策略深入分析。

#### 文档分类分级

| 级别 | 文档类型 | 处理策略 | 示例 |
|------|---------|---------|------|
| **P0 必读** | README.md, CHANGELOG.md, CONTRIBUTING.md | 全量读取，提取所有事实 | 根目录 README |
| **P1 高优** | docs/ 目录下的架构/API/设计文档 | 按相关性评分，高分全量读 | docs/architecture.md |
| **P2 标准** | 其他目录下的 MD 文件 | 建索引 + 提取标题和首段 | guides/, examples/ 下 |
| **P3 跳过** | node_modules/ 等第三方目录 | 跳过 | 第三方库 README |

#### 相关性评分维度

- **路径深度**：根目录 (+30) > 2 层 (+20) > 3 层 (+10)
- **文件名关键词**：含 architecture/api/design/guide 等关键词 (+15)
- **目录优先级**：docs/ 目录内 (+10)

#### 文档-代码交叉验证

将 MD 提取的事实与代码分析结果对比：
- 技术栈声明一致性（如 README 声明 PostgreSQL vs 代码实际使用 MySQL）
- API 端点声明一致性（文档声明的路由 vs 代码中的路由定义）
- 不一致处标注 `[文档-代码不一致]`

---

## 模式一：全局扫描（Full Scan）

### Step 1：项目类型检测

扫描项目根目录，检测：

| 检测项 | 方法 |
|--------|------|
| 项目类型 | 关键文件：package.json → web/node, go.mod → Go, requirements.txt → Python 等 |
| 项目结构 | monolith / monorepo / multi-part（如 client+server） |
| 主要语言 | 从文件后缀统计 |
| 框架 | 从依赖中提取（Express, Spring, Django, Gin 等） |

12 种项目类型识别：web, mobile, backend, cli, library, desktop, game, data, extension, infra, embedded, custom

向用户展示检测结果，确认后继续。

### Step 2：技术栈分析

对每个子项目/模块：
- 解析依赖文件（package.json, go.mod, requirements.txt, pom.xml 等）
- 提取框架、语言版本、数据库、关键依赖
- 判断架构模式（分层 / 微服务 / 事件驱动 等）

**立即写入** `docs/tech-stack.md`

### Step 3：条件扫描（根据项目类型）

根据项目类型决定扫描内容：

| 条件 | 扫描内容 |
|------|---------|
| 有 routes/controllers/ | API 路由和端点 |
| 有 models/schemas/ | 数据模型和数据库 Schema |
| 有 components/ui/ | UI 组件清单 |
| 有 services/handlers/ | 业务逻辑层 |
| 有 middleware/ | 认证鉴权模式 |
| 有 migrations/ | 数据库迁移历史 |
| 有 .github/workflows/ | CI/CD 流水线 |
| 有 Dockerfile | 部署架构 |

#### API 扫描（如适用）

- 扫描路由定义文件
- 提取：HTTP 方法、路径、请求/响应类型、认证要求
- 按 Controller/模块分组

**立即写入** `docs/api-contracts.md`

#### 数据模型扫描（如适用）

- 扫描 Entity/Model/Schema 文件
- 提取：表名、字段、类型、关系、约束
- ORM 配置（Prisma, TypeORM, SQLAlchemy 等）

**立即写入** `docs/data-models.md`

#### 业务逻辑扫描

- 扫描 Service 层
- 提取核心业务流程（从方法调用链推断）
- 识别外部依赖（API 调用、数据库访问、消息队列）

**立即写入** `docs/business-logic.md`

### Step 4：源码树分析

生成带注释的目录树：
- 标注每个关键目录的用途
- 标注入口文件
- 标注模块间集成点

**立即写入** `docs/source-tree.md`

### Step 5：架构文档

综合所有扫描结果，生成架构文档：
- 系统总览
- 技术栈表
- 架构模式描述
- 数据流概览
- 部署架构（如有）
- 集成点（如多模块）

**立即写入** `docs/architecture.md`

### Step 6：开发指南

提取开发相关信息：
- 环境要求
- 安装步骤
- 构建和运行命令
- 测试方式

**立即写入** `docs/development-guide.md`

### Step 7：生成主索引

创建 `docs/index.md` 作为 AI Agent 的入口：
- 项目概要
- 快速参考表
- 所有文档的链接和说明
- AI 使用指南（指向哪些文档做什么）

**立即写入** `docs/index.md`

---

## 模式二：模块深入（Deep Dive）

针对某个微服务或模块做逐文件详尽分析。

### 选择目标

向用户展示可深入的区域（根据全局扫描结果）：
- API 路由组
- 功能模块
- Service/业务逻辑
- UI 组件区

也接受自定义路径。

### 逐文件扫描

**必须全文阅读，禁止跳过。** 对每个文件提取：

```
文件路径：完整路径
用途：1-2 句话说明
代码行数：LOC
导出：
  - functionName(param: Type): ReturnType — 说明
  - ClassName — 说明 + 关键方法
  - Type/Interface — 说明
依赖：import 了什么，为什么
被依赖：谁 import 了这个文件
关键实现：重要逻辑、算法、模式
副作用：API 调用、数据库查询、文件 I/O
错误处理：try/catch、错误边界
测试：关联的测试文件和覆盖情况
TODO/FIXME：行号 + 内容
```

### 关系分析

- 构建依赖图（文件为节点，import 为边）
- 追踪数据流（函数调用链、数据转换）
- 识别集成点（外部 API、共享状态、事件）
- 检测循环依赖

### 输出

生成 `docs/deep-dive-{module-name}.md`，包含：
- 完整文件清单
- 依赖图
- 数据流分析
- 集成点
- 修改指南
- 风险提示

更新 `docs/index.md` 添加 deep-dive 链接。

---

## 扫描深度级别

### 智能深度控制（默认）

scan 根据项目规模和架构**自动选择**最优深度，无需用户手动选择。

**规模 → 深度映射：**

| 项目规模 | 源文件数 | 自动深度 | 行为 |
|---------|---------|---------|------|
| small | <100 | Exhaustive | 全量读取所有源文件 |
| medium | 100–500 | Deep | 读关键目录 + 高价值文件 |
| large | 500–2000 | Deep | 自动识别模块边界，按模块分批扫描 |
| xlarge | >2000 | Deep | 按模块分批扫描，合并生成全局文档 |

**架构感知调整：**

| 架构 | 自动深度 | 说明 |
|------|---------|------|
| monolith | 按规模映射 | 单模块，整体扫描 |
| monorepo | Deep | 按子 package/app 分模块扫描 |
| microservice | Deep | 按服务分模块扫描 |
| multi-part | Deep | client/server 分层扫描 |

**手动覆盖：** 用户可通过 `--depth=quick|deep|exhaustive` 参数覆盖自动选择。

### 深度级别定义

| 级别 | 方式 | 适用场景 |
|------|------|---------|
| **Quick** | 只看目录结构和配置文件 | 快速了解项目概貌 |
| **Deep** | 读关键目录中的文件 | 准备做 brownfield PRD |
| **Exhaustive** | 读全部源文件 | 完整分析、迁移规划 |

---

## 批量处理策略（Deep/Exhaustive 模式）

当扫描大量文件时，按子目录分批处理：

1. 读取一个子目录的所有文件
2. 提取信息，写入对应文档
3. 验证文档完整性
4. **清理上下文**，只保留 1-2 句摘要
5. 进入下一个子目录

每批完成后更新状态文件 `docs/.scan-state.json`，支持中断恢复。

---

## 输出文件结构

```
docs/
├── index.md                  # 主索引（AI 入口）
├── project-overview.md        # 项目概览
├── tech-stack.md              # 技术栈
├── architecture.md            # 架构文档
├── source-tree.md             # 源码树分析
├── api-contracts.md           # API 契约（如适用）
├── data-models.md             # 数据模型（如适用）
├── business-logic.md          # 业务逻辑（如适用）
├── development-guide.md       # 开发指南
├── deep-dive-{module}.md      # 模块深入（按需）
├── integration-architecture.md # 集成架构（如多模块）
└── .scan-state.json           # 扫描状态（用于恢复）
```

---

## 停止条件

**必须停止并询问用户的情况**：
- 项目类型检测结果不确定
- 发现多模块结构但边界模糊
- 文件数量超过 500 个（需要确认是否需要过滤）
- 某个文件超过 5000 行（需要确认是否全文阅读）
- 扫描结果和用户预期不符

**绝对禁止**：
- 编造不存在的接口或模型
- 把猜测当事实写入文档
- 复制大段源码进文档（应提取结构而非内容）
- 一次性加载所有文件到上下文（必须分批）

---

## 验证清单

完成前必须确认：

- [ ] 项目类型和结构已确认
- [ ] 技术栈信息准确
- [ ] API 端点完整（如有）
- [ ] 数据模型关系正确（如有）
- [ ] 所有文档间链接有效
- [ ] 没有未替换的模板占位符
- [ ] 不确定的内容标注了 `[未确认]`
- [ ] index.md 可作为独立入口使用
