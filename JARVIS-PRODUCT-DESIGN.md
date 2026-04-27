# JARVIS 产品设计 — AI 知识基础设施

> 版本：v1.0\
> 日期：2026-04-27\
> 定位：让代码变成 AI 可消费知识的自主 Agent，产出物对所有 Agent 开放

***

## 一、产品全景

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        JARVIS 产品矩阵                               │
│                                                                     │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│   │  JARVIS Agent │    │  JARVIS Board │    │  JARVIS Artifacts    │  │
│   │  (终端 Agent)  │    │  (Web 看板)    │    │  (开放产出物)         │  │
│   │              │    │              │    │                      │  │
│   │  对话式交互    │    │  可视化仪表盘  │    │  routing-table.md    │  │
│   │  知识生产     │    │  项目总览      │    │  quick-ref.md        │  │
│   │  知识查询     │    │  知识健康度    │    │  distillates/*.md    │  │
│   │  需求路由     │    │  服务图谱      │    │  decisions.md        │  │
│   │              │    │              │    │                      │  │
│   │  生产侧      │    │  展示侧       │    │  消费侧              │  │
│   └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘  │
│          │                   │                       │              │
│          └───────────────────┼───────────────────────┘              │
│                              │                                      │
│                     ┌────────▼────────┐                             │
│                     │  知识仓库 (Git)   │                             │
│                     │                 │                             │
│                     │  company-jarvis │                             │
│                     │  所有产出物的     │                             │
│                     │  单一真相源       │                             │
│                     └─────────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
```

### 核心原则

| 原则       | 含义                              |
| -------- | ------------------------------- |
| 产出物开放    | 所有产出物为纯 Markdown，任何 Agent 原生可消费 |
| 生产侧封装    | 知识生产过程封装为 Agent，用户不感知内部实现       |
| 知识积累     | 随使用持续积累组织知识，越用越值钱               |
| Agent 无关 | 不绑定特定 LLM、特定 Agent 框架           |

***

## 二、JARVIS Agent — 终端 Agent

### 2.1 架构

```text
用户
  │
  │ 自然语言对话
  ▼
┌──────────────────────────────────────────────┐
│            JARVIS Agent (基于 pi SDK)          │
│                                              │
│  ┌─────────────┐   ┌──────────────────────┐  │
│  │  TUI 层      │   │  Extension 路由层     │  │
│  │             │   │                      │  │
│  │ JARVIS 主题  │   │ 消息拦截              │  │
│  │ 品牌化界面   │   │ Skill 自动加载        │  │
│  │ 快捷键       │   │ 工具注册              │  │
│  │ 编辑器       │   │ 事件钩子              │  │
│  └─────────────┘   └──────────┬───────────┘  │
│                               │              │
│                    ┌──────────▼───────────┐   │
│                    │  Skill 执行层         │   │
│                    │                      │   │
│                    │  document-project    │   │
│                    │  distillator         │   │
│                    │  requirement-router  │   │
│                    │  (用户不可见)         │   │
│                    └──────────┬───────────┘   │
│                               │              │
│                    ┌──────────▼───────────┐   │
│                    │  Tool 实现层          │   │
│                    │                      │   │
│                    │  jarvis_scan         │   │
│                    │  jarvis_distill      │   │
│                    │  jarvis_route        │   │
│                    │  jarvis_query        │   │
│                    │  (用户不可见)         │   │
│                    └──────────┬───────────┘   │
│                               │              │
│  ┌────────────────────────────▼───────────┐  │
│  │         pi SDK (免费复用)                │  │
│  │                                        │  │
│  │  Agent Loop     TUI 框架               │  │
│  │  20+ LLM 支持   Session 管理           │  │
│  │  Tool Calling   上下文压缩              │  │
│  │  流式输出       分支/回溯               │  │
│  └────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────┘
                   │ 产出
                   ▼
          ┌─────────────────┐
          │  JARVIS 产出物   │
          │  (纯 Markdown)  │
          └─────────────────┘
```

### 2.2 两种运行模式

```text
┌─── 生产模式（自主工作）────────────────────────────────────────┐
│                                                              │
│  jarvis scan user-service                                    │
│    → 调用 document-project Skill                             │
│    → 扫描代码 → 产出 docs/                                    │
│                                                              │
│  jarvis distill user-service                                 │
│    → 调用 distillator Skill                                  │
│    → 产出 Layer 1 速查卡 + Layer 2 蒸馏片段                    │
│                                                              │
│  jarvis build-routing-table                                  │
│    → 从所有服务提取信息                                        │
│    → 产出 Layer 0 路由表                                      │
│                                                              │
│  jarvis refresh user-service                                 │
│    → 检测代码变更                                             │
│    → 增量更新知识产物                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─── 问答模式（交互式）────────────────────────────────────────┐
│                                                              │
│  jarvis                                                      │
│                                                              │
│  JARVIS> user-service 的认证流程是什么？                    │
│  JARVIS: 根据知识库记录，认证流程如下...                       │
│    （来源：distillates/user-service/02-api-contracts.md）     │
│                                                              │
│  JARVIS> 订单创建调用了哪些外部服务？                        │
│  JARVIS: 订单创建涉及 3 个服务...                              │
│    （来源：routing-table.md + quick-ref.md）                  │
│                                                              │
│  JARVIS> 这个需求要加载上下文吗：给用户表加 phone 字段       │
│  JARVIS: 路由决策：direct                                     │
│    单服务 CRUD，无需加载额外上下文                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Extension 核心设计

```typescript
// extensions/jarvis.ts — 核心路由逻辑（伪代码）

export default function (pi: ExtensionAPI) {

  // ═══ 工具注册 — 用户看不到实现细节 ═══

  pi.registerTool({
    name: "jarvis_scan",
    description: "扫描项目代码，逆向生成项目文档",
    parameters: Type.Object({
      target: Type.String({ description: "项目名或路径" }),
      mode: Type.Optional(Type.String({ description: "global | module" })),
    }),
    handler: async (args) => {
      const skill = loadSkill("document-project");  // 隐藏加载
      return executeSkill(skill, args);
    },
  });

  pi.registerTool({
    name: "jarvis_distill",
    description: "蒸馏文档，生成三层知识产物",
    parameters: Type.Object({
      source: Type.String({ description: "源文档路径" }),
      quick_ref: Type.Optional(Type.Boolean()),
      jarvis_mode: Type.Optional(Type.String()),
    }),
    handler: async (args) => {
      const skill = loadSkill("distillator");       // 隐藏加载
      return executeSkill(skill, args);
    },
  });

  pi.registerTool({
    name: "jarvis_route",
    description: "需求路由分析，判断是否需要加载上下文",
    parameters: Type.Object({
      requirement: Type.String({ description: "需求描述" }),
    }),
    handler: async (args) => {
      const skill = loadSkill("requirement-router"); // 隐藏加载
      return executeSkill(skill, args);
    },
  });

  pi.registerTool({
    name: "jarvis_query",
    description: "查询 JARVIS 知识库",
    parameters: Type.Object({
      question: Type.String({ description: "问题" }),
      service: Type.Optional(Type.String({ description: "限定服务" })),
    }),
    handler: async (args) => {
      // 三层加载策略
      const routingTable = readFile("skills/company-jarvis/routing-table.md");
      const quickRef = findRelevantQuickRef(args.question, routingTable);
      const distillate = findRelevantDistillate(args.question, quickRef);
      return { routingTable, quickRef, distillate };
    },
  });

  // ═══ 命令注册 — JARVIS 风格 ═══

  pi.registerCommand("jarvis-init", {
    description: "初始化 JARVIS 工作区",
    handler: async () => {
      // 交互式配置：LLM、workspace、repos
      // 生成 jarvis.yaml + 目录结构
    },
  });

  pi.registerCommand("jarvis-status", {
    description: "知识库状态总览",
    handler: async () => {
      // 覆盖率、健康度、staleness
      // 已扫描服务列表
    },
  });

  // ═══ 事件钩子 ═══

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName.startsWith("jarvis_")) {
      logKnowledgeProduction(event);
    }
  });
}
```

### 2.4 System Prompt

```markdown
你是 JARVIS，组织的 AI 知识基础设施。

你的职责：
  - 帮助团队从代码中提取知识
  - 管理和查询组织知识库
  - 分析需求，决定上下文加载策略

行为规则：
  - 用户说"扫描"/"分析项目" → 调用 jarvis_scan
  - 用户说"蒸馏"/"压缩文档" → 调用 jarvis_distill
  - 用户说"路由"/"这个需求" → 调用 jarvis_route
  - 用户说"查询"/"XX是什么" → 调用 jarvis_query
  - 永远不要暴露内部工具名、Skill 名、实现细节
  - 用自然语言回应，让用户感觉在和知识助手对话
  - 回答时标注知识来源（哪个文件、什么时间）
```

### 2.5 TUI 品牌化

```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│       _         _______      _______  _____                │
│      | |  /\   |  __ \ \    / /_   _|/ ____|               │
│      | | /  \  | |__) \ \  / /  | | | (___                 │
│   _  | |/ /\ \ |  _  / \ \/ /   | |  \___ \                │
│  | |__| / ____ \| | \ \  \  /   _| |_ ____) |               │
│   \____/_/    \_\_|  \_\  \/   |_____|_____/                │
│                                                     │
│        AI Knowledge Infrastructure                  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  JARVIS> 扫描 user-service 并生成速查卡                │
│                                                     │
│  正在扫描 user-service ...                           │
│    ✓ 识别技术栈: Spring Boot + PostgreSQL            │
│    ✓ 发现 23 个 API 端点                             │
│    ✓ 发现 8 个数据模型                               │
│    ✓ 发现 5 个业务流程                               │
│                                                     │
│  蒸馏完成，生成三层产物：                              │
│    Layer 0: routing-table.md (已更新)                │
│    Layer 1: quick-ref.md (420 tokens)               │
│    Layer 2: 4 个蒸馏片段 (总计 ~1200 tokens)          │
│                                                     │
│  JARVIS>                                             │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ./company-jarvis  │  3 services  │  12 artifacts   │
└─────────────────────────────────────────────────────┘
```

### 2.6 配置模型

```yaml
# jarvis.yaml — JARVIS Agent 配置

llm:
  provider: anthropic          # openai / google / deepseek / ollama / ...
  model: claude-sonnet-4-6
  api_key: ${ANTHROPIC_API_KEY}  # 环境变量引用
  # 或使用 OAuth 登录
  # auth: login

workspace:
  root: ./company-jarvis       # 产出物根目录
  language: zh                 # 产出语言 zh | en

repos:
  - name: user-service
    path: /repos/user-service
    stack: spring-boot + postgresql
  - name: order-service
    path: /repos/order-service
    stack: spring-boot + redis + kafka
  - name: inventory-service
    path: /repos/inventory-service
    stack: go + mongodb

agent:
  token_budget:
    routing_table: 500         # Layer 0 上限
    quick_ref: 2000            # Layer 1 上限
    distillate_fragment: 1000  # Layer 2 片段上限
  auto_refresh: true           # 检测代码变更自动刷新
  refresh_interval: 24h        # 刷新间隔
```

***

## 三、JARVIS Board — Web 看板

### 3.1 定位

JARVIS Agent 解决**知识的生产和消费**，JARVIS Board 解决**知识的可视化和管理**。

```text
┌──────────────────────────────────────────────────────┐
│                                                      │
│   JARVIS Agent          JARVIS Board                 │
│   (终端)                (浏览器)                      │
│                                                      │
│   知识生产 ──────┐      ┌────── 知识可视化            │
│   知识查询       │      │      知识管理               │
│   需求路由       │      │      团队协作               │
│                 │      │                             │
│                 ▼      ▼                             │
│           ┌──────────────┐                           │
│           │  知识仓库     │                           │
│           │  (Git Repo)  │                           │
│           └──────────────┘                           │
│                                                      │
│   产出物是同一份                                      │
│   Board 只读展示，不修改 Agent 产出物                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 3.2 页面结构

```text
JARVIS Board
├── Dashboard（总览仪表盘）
├── Services（服务列表）
├── Knowledge Map（知识图谱）
├── Artifacts（产出物浏览器）
├── Timeline（知识时间线）
└── Settings（配置管理）
```

### 3.3 页面详细设计

#### Dashboard — 总览仪表盘

```text
┌─────────────────────────────────────────────────────────────────────┐
│  JARVIS Board                                    user@example ▼  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─ 知识库健康度 ──────────────┐  ┌─ 服务覆盖 ──────────────────┐   │
│  │                            │  │                             │   │
│  │  ██████████████░░░░  72%   │  │  ●●● user-service    ✅     │   │
│  │  已蒸馏 / 总服务数          │  │  ●●● order-service   ✅     │   │
│  │                            │  │  ●●○ inventory       ⚠️     │   │
│  │  知识新鲜度: 85%           │  │  ●○○ payment         ⚠️     │   │
│  │  上次全量扫描: 2h ago      │  │  ○○○ logistics       ❌     │   │
│  │                            │  │                             │   │
│  │  ✅ 健康  ⚠️ 过期  ❌ 未扫描 │  │  ✅ 完整  ⚠️ 部分  ❌ 无     │   │
│  └────────────────────────────┘  └─────────────────────────────┘   │
│                                                                     │
│  ┌─ 最近变更 ──────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  10:30  user-service   速查卡已刷新（3 文件变更）            │   │
│  │  09:15  order-service  新增蒸馏片段：优惠券逻辑              │   │
│  │  昨天   inventory      首次扫描完成                         │   │
│  │  昨天   routing-table  路由表已更新（新增 inventory）         │   │
│  │  3天前  order-service  知识回写：新增决策记录                 │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ 产出物统计 ────────────────┐  ┌─ 快速操作 ─────────────────┐   │
│  │                            │  │                            │   │
│  │  路由表      1  个          │  │  [扫描新服务]               │   │
│  │  速查卡      4  个          │  │  [刷新所有知识]             │   │
│  │  蒸馏片段   16  个          │  │  [导出报告]                │   │
│  │  决策记录    8  条          │  │  [查看路由表]               │   │
│  │  已知问题   12  条          │  │                            │   │
│  │                            │  │                            │   │
│  └────────────────────────────┘  └────────────────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Dashboard │ Services │ Knowledge Map │ Artifacts │ Timeline        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Services — 服务列表

```text
┌─────────────────────────────────────────────────────────────────────┐
│  JARVIS Board > Services                         [+ 添加服务]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  筛选: [全部 ▼]  [技术栈 ▼]  [状态 ▼]         🔍 搜索服务名...     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  ● user-service                                     ✅ 完整 │   │
│  │    用户中心 │ Spring Boot + PostgreSQL │ @zhangsan        │   │
│  │    23 endpoints │ 8 models │ 5 workflows                 │   │
│  │    上次更新: 2h ago │ Layer 0 ✓ Layer 1 ✓ Layer 2 ✓     │   │
│  │                                                    [详情 →] │   │
│  │─────────────────────────────────────────────────────────────│   │
│  │                                                             │   │
│  │  ● order-service                                    ✅ 完整 │   │
│  │    订单处理 │ Spring Boot + Redis + Kafka │ @lisi         │   │
│  │    31 endpoints │ 12 models │ 8 workflows                 │   │
│  │    上次更新: 1d ago │ Layer 0 ✓ Layer 1 ✓ Layer 2 ✓      │   │
│  │                                                    [详情 →] │   │
│  │─────────────────────────────────────────────────────────────│   │
│  │                                                             │   │
│  │  ● inventory-service                                ⚠️ 部分 │   │
│  │    库存管理 │ Go + MongoDB │ @wangwu                      │   │
│  │    15 endpoints │ 4 models │ —                            │   │
│  │    上次更新: 3d ago │ Layer 0 ✓ Layer 1 ✓ Layer 2 ✗      │   │
│  │                                              [补全 Layer 2] │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Dashboard │ Services │ Knowledge Map │ Artifacts │ Timeline        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Knowledge Map — 知识图谱

```text
┌─────────────────────────────────────────────────────────────────────┐
│  JARVIS Board > Knowledge Map                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │                                                           │     │
│  │                    ┌──────────────┐                       │     │
│  │          ┌────────▶│ user-service │◀───────┐              │     │
│  │          │         │   (23 EP)    │         │              │     │
│  │          │         └──────┬───────┘         │              │     │
│  │          │                │                 │              │     │
│  │     查询用户信息       验证用户          获取用户地址      │     │
│  │          │                │                 │              │     │
│  │          │                ▼                 │              │     │
│  │  ┌───────┴───────┐  ┌──────────────┐  ┌───┴────────────┐ │     │
│  │  │    payment     │  │    order     │  │   logistics    │ │     │
│  │  │   service      │──│   service    │──│   service      │ │     │
│  │  │   (12 EP)      │  │   (31 EP)    │  │   (18 EP)      │ │     │
│  │  └───────────────┘  └──────┬───────┘  └────────────────┘ │     │
│  │                            │                              │     │
│  │                       扣减库存                             │     │
│  │                            │                              │     │
│  │                     ┌──────▼───────┐                      │     │
│  │                     │  inventory   │                      │     │
│  │                     │   service    │                      │     │
│  │                     │   (15 EP)    │                      │     │
│  │                     └──────────────┘                      │     │
│  │                                                           │     │
│  │  ── 依赖关系    EP = API Endpoints                        │     │
│  │  ● 节点大小 = 知识完整度                                   │     │
│  │  线条粗细 = 调用频率                                      │     │
│  │                                                           │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                     │
│  点击节点查看服务详情 │ 拖拽调整布局 │ 双击展开 API 列表              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Dashboard │ Services │ Knowledge Map │ Artifacts │ Timeline        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Artifacts — 产出物浏览器

````text
┌─────────────────────────────────────────────────────────────────────┐
│  JARVIS Board > Artifacts                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─ 文件树 ──────────┐  ┌─ 预览 ──────────────────────────────┐   │
│  │                   │  │                                     │   │
│  │  📁 company-jarvis│  │  📄 order-service / quick-ref.md    │   │
│  │  ├── 📁 skills    │  │  ─────────────────────────────      │   │
│  │  │   ├── 📁 main  │  │                                     │   │
│  │  │   │   └── 📄 r │  │  ## Verify                          │   │
│  │  │   ├── 📁 order │  │  ```bash                            │   │
│  │  │   │   ├── 📄 S │  │  ./gradlew test          # 测试     │   │
│  │  │   │   └── 📄 q │  │  ./gradlew boot:run      # 运行     │   │
│  │  │   ├── 📁 user  │  │  docker compose up -d     # 容器     │   │
│  │  │   │   ├── 📄 S │  │  ```                                 │   │
│  │  │   │   └── 📄 q │  │                                     │   │
│  │  │   └── 📁 inv   │  │  ## Key Constraints                 │   │
│  │  ├── 📁 distill   │  │  1. 订单号全局唯一（雪花算法）       │   │
│  │  │   ├── 📁 order │  │  2. 创建后 30 分钟内可取消           │   │
│  │  │   │   ├── 📄 _ │  │  3. 库存扣减必须幂等                 │   │
│  │  │   │   ├── 📄 0 │  │                                     │   │
│  │  │   │   ├── 📄 0 │  │  ## Pitfalls                        │   │
│  │  │   │   ├── 📄 0 │  │  - 症状: 409 冲突 → 原因: 幂等键    │   │
│  │  │   │   └── 📄 0 │  │  - 症状: 订单丢失 → 原因: Kafka ... │   │
│  │  │   └── 📁 user  │  │                                     │   │
│  │  ├── 📁 modules   │  │  ## API Endpoints                   │   │
│  │  └── 📁 decisions │  │  POST /orders        创建订单       │   │
│  │                   │  │  GET  /orders/{id}   查询订单       │   │
│  │                   │  │  PUT  /orders/{id}   更新订单       │   │
│  │                   │  │                                     │   │
│  └───────────────────┘  └─────────────────────────────────────┘   │
│                                                                     │
│  [Markdown] [Raw] [Token Count]           Token: 420 / 2000 预算   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Dashboard │ Services │ Knowledge Map │ Artifacts │ Timeline        │
└─────────────────────────────────────────────────────────────────────┘
````

#### Timeline — 知识时间线

```text
┌─────────────────────────────────────────────────────────────────────┐
│  JARVIS Board > Timeline                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  知识回写历史 — 组织知识的演化过程                                    │
│                                                                     │
│  2026-04                                                            │
│  ═══════                                                            │
│                                                                     │
│  ──●── 04-27 14:30  order-service                                   │
│  │                  速查卡自动刷新                                    │
│  │                  变更: 3 文件更新，2 个 API 新增                    │
│  │                                                                │
│  ──●── 04-27 10:15  order-service                                   │
│  │                  知识回写: 决策记录                                │
│  │                  "订单号改为雪花算法，因为 UUID 导致索引碎片"       │
│  │                                                                │
│  ──●── 04-26 16:00  inventory-service                               │
│  │                  首次扫描完成                                     │
│  │                  产出: docs/ + Layer 1 速查卡                     │
│  │                                                                │
│  ──●── 04-25 09:00  routing-table                                   │
│  │                  路由表更新                                       │
│  │                  新增: inventory-service, payment-service        │
│  │                                                                │
│  ──●── 04-20 14:00  user-service                                    │
│  │                  知识回写: 已知问题                                │
│  │                  "Redis 缓存雪崩导致用户查询超时"                   │
│  │                                                                │
│  ──●── 04-15 10:00  order-service                                   │
│                     首次完整蒸馏                                     │
│                     产出: Layer 0 + Layer 1 + Layer 2 (4 片段)      │
│                                                                     │
│  ◀ 2026-03                                                          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Dashboard │ Services │ Knowledge Map │ Artifacts │ Timeline        │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Board 技术架构

```text
┌──────────────────────────────────────────────────────┐
│                   JARVIS Board                       │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐ │
│  │  Frontend   │  │  Backend   │  │  知识仓库适配   │ │
│  │            │  │            │  │                │ │
│  │  React/    │  │  Node.js   │  │  Git 读取      │ │
│  │  Next.js   │  │  API Server│  │  文件监听      │ │
│  │            │  │            │  │  变更检测      │ │
│  │  图谱: D3  │  │  REST API  │  │                │ │
│  │  编辑器:   │  │  WebSocket │  │  只读          │ │
│  │  Monaco    │  │            │  │  不修改产出物   │ │
│  └─────┬──────┘  └─────┬──────┘  └───────┬────────┘ │
│        │               │                  │          │
│        └───────────────┼──────────────────┘          │
│                        │                             │
│                        ▼                             │
│              ┌──────────────────┐                    │
│              │  知识仓库 (Git)   │                    │
│              │  company-jarvis  │                    │
│              └──────────────────┘                    │
└──────────────────────────────────────────────────────┘
```

**关键设计：Board 只读，不修改 Agent 产出物。** 知识的生产唯一入口是 JARVIS Agent。

***

## 四、JARVIS Artifacts — 开放产出物

### 4.1 产出物格式

```text
company-jarvis/                     ← 知识仓库（单一真相源）
├── skills/
│   ├── company-jarvis/
│   │   ├── SKILL.md               ← Agent 入口（工作流）
│   │   └── routing-table.md       ← Layer 0（<500 token，常驻）
│   ├── user-service/
│   │   ├── SKILL.md               ← 完整 Repo Skill
│   │   └── quick-ref.md           ← Layer 1 速查卡
│   └── order-service/
│       ├── SKILL.md
│       └── quick-ref.md
├── distillates/
│   ├── user-service/
│   │   ├── _index.md              ← 片段导航
│   │   ├── 01-overview.md         ← Layer 2 片段
│   │   ├── 02-api-contracts.md
│   │   ├── 03-data-models.md
│   │   └── 04-business-logic.md
│   └── order-service/
│       ├── _index.md
│       └── ...
├── modules/
│   ├── user-service/
│   │   ├── overview.md
│   │   ├── known-issues.md
│   │   ├── decisions.md
│   │   └── test-coverage.md
│   └── ...
└── cross-cutting/
    ├── module-interactions.md
    └── version-changelog.md
```

### 4.2 消费方式 — 零适配

```text
任何 AI Agent 消费 JARVIS 产出物的方式：

1. 读 routing-table.md          ← 常驻，知道有哪些服务
2. 读对应 quick-ref.md          ← 知道验证命令、约束、易错点
3. 读对应 distillate 片段        ← 知道具体接口、数据模型

不需要：
  ❌ 安装 JARVIS
  ❌ 调用 JARVIS API
  ❌ 适配任何协议
  ❌ 任何适配代码

只需要：
  ✅ 能读 Markdown 文件
  ✅ 理解文件中的路由规则
```

### 4.3 产出物的自说明性

routing-table.md 头部包含消费规则，任何 Agent 读取后自动获得路由能力：

```markdown
# 路由表 — Layer 0

> 读取此文件后，根据用户需求自动判断加载策略：
> - 提到 0 个已知服务 → 直接工作
> - 提到 1 个服务 + 简单改动 → 直接工作
> - 提到 1 个服务 + 改接口 → 读该服务 quick-ref.md
> - 提到 2+ 个服务 → 读对应 quick-ref.md
> - 需要具体 Schema → 再读 distillates/ 对应片段

| Service | Role | Stack | Owner | Key Constraints |
|---------|------|-------|-------|----------------|
| ...     | ...  | ...   | ...   | ...            |
```

***

## 五、产品壁垒分析

```text
┌────────────────────────────────────────────────────────────┐
│                     壁垒层级                                │
│                                                            │
│  用户感知：   JARVIS 品牌界面 + 自然语言交互                │
│              ↓ 不可复制                                     │
│  Extension：  消息路由 + 工具封装 + 事件钩子                │
│              ↓ 编译后分发，源码不暴露                        │
│  Skills：    3 个核心 Skill（知识提取逻辑）                 │
│              ↓ 核心知识产权                                 │
│  知识积累：  每个公司的组织知识                              │
│              ↓ 独一无二，不可复制                           │
│  pi SDK：    开源基础层                                     │
│              ↑ 不是壁垒，但降低开发成本                     │
│                                                            │
│  真正壁垒 = Skills 质量 + 知识积累速度 + 网络效应           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

| 层次               | 可复制性     | 壁垒强度          |
| ---------------- | -------- | ------------- |
| pi SDK 基础层       | 完全开源     | 无（但降低开发成本）    |
| JARVIS Extension | 编译后分发    | 中（可逆向但成本高）    |
| JARVIS Skills    | 核心逻辑不暴露  | 高（知识提取质量难复制）  |
| 公司知识积累           | 每家公司独一无二 | 极高（时间积累的护城河）  |
| 网络效应             | 团队越用越依赖  | 极高（切换成本随使用增加） |

***

## 六、技术栈

### JARVIS Agent

| 组件       | 技术                                       | 说明                              |
| -------- | ---------------------------------------- | ------------------------------- |
| Agent 框架 | pi SDK (`@mariozechner/pi-coding-agent`) | Agent Loop + TUI + Tool Calling |
| LLM 层    | pi AI (`@mariozechner/pi-ai`)            | 20+ Provider 统一 API             |
| 扩展层      | TypeScript Extension                     | 消息路由 + 工具注册                     |
| 技能层      | Markdown SKILL.md                        | 知识提取逻辑（编译后分发）                   |
| 配置       | YAML                                     | jarvis.yaml 用户配置                |
| 分发       | pi Package / npm / git                   | 安装和更新                           |

### JARVIS Board

| 组件  | 技术                        | 说明                   |
| --- | ------------------------- | -------------------- |
| 前端  | React + Next.js           | SSR + 静态生成           |
| 图谱  | D3.js / react-force-graph | 服务依赖关系可视化            |
| 编辑器 | Monaco Editor             | Markdown 预览          |
| 后端  | Node.js + Express/Fastify | REST API + WebSocket |
| 数据源 | Git 知识仓库                  | 只读，监听变更              |
| 部署  | Docker / Vercel           | 按需选择                 |

***

## 七、开发路线图

### Phase 1: JARVIS Agent MVP（2-3 周）

```text
目标：能在终端中对话式生产知识

Week 1:
  ✅ pi SDK 环境搭建 + 项目结构
  ✅ jarvis.ts Extension 骨架
  ✅ jarvis_scan 工具实现（对接 document-project Skill）
  ✅ jarvis.yaml 配置管理

Week 2:
  ✅ jarvis_distill 工具实现（对接 distillator Skill）
  ✅ jarvis_query 工具实现（三层加载查询）
  ✅ jarvis_route 工具实现（对接 requirement-router Skill）
  ✅ TUI 主题定制（JARVIS 品牌化）

Week 3:
  ✅ System Prompt 调优
  ✅ 端到端测试：真实项目扫描 → 蒸馏 → 查询
  ✅ Pi Package 打包和分发配置
  ✅ 文档和示例
```

### Phase 2: JARVIS Board 基础版（3-4 周）

```text
目标：能在浏览器中查看知识库状态

Week 1-2:
  ✅ 项目脚手架（Next.js + API Server）
  ✅ Git 知识仓库读取层
  ✅ Dashboard 页面（健康度、覆盖率、最近变更）
  ✅ Services 列表页

Week 3-4:
  ✅ Artifacts 文件浏览器（Markdown 预览）
  ✅ Knowledge Map 服务依赖图谱
  ✅ Timeline 知识时间线
  ✅ 部署配置
```

### Phase 3: 增值功能（持续迭代）

```text
待探索：
  ○ 知识库增量更新 + 变更通知
  ○ 团队协作：评论、审批知识回写
  ○ 行业模板：Fintech / E-commerce / SaaS 预置 Skill
  ○ 知识质量评分和优化建议
  ○ 多语言产出物
  ○ CI/CD 集成（代码变更自动触发知识刷新）
  ○ API 开放：让第三方工具查询 JARVIS 知识库
```

***

## 八、与现有设计的关系

```text
现有（已完成）                    本设计（新增）
─────────────                    ────────────

SKILL.md（主 JARVIS）    ──→    JARVIS Agent 的核心 Skill
document-project Skill   ──→    jarvis_scan 工具的内部实现
distillator Skill        ──→    jarvis_distill 工具的内部实现
requirement-router Skill ──→    jarvis_route 工具的内部实现

三层加载策略             ──→    jarvis_query 的查询逻辑
routing-table.md 模板    ──→    Layer 0 产出物
quick-ref.md 模板        ──→    Layer 1 产出物
distillates/ 目录        ──→    Layer 2 产出物

SCALABILITY-ANALYSIS.md  ──→    本设计的分析基础
```

**所有现有设计不变，本设计是在现有基础上增加产品包装层。**

***

## 九、关键纪律

| 纪律               | 原因                                         |
| ---------------- | ------------------------------------------ |
| 产出物永远是纯 Markdown | 确保 Agent 无关性，任何 Agent 零成本消费                |
| Board 只读不写       | 知识生产唯一入口是 Agent，避免数据不一致                    |
| Skills 不暴露给用户    | 保护核心知识产权，用户只感知对话接口                         |
| pi SDK 不 fork    | 跟随上游更新，不维护分支                               |
| 配置优于代码           | 用户通过 jarvis.yaml 定制，不改代码                   |
| 渐进式交付            | Phase 1 出 Agent MVP，Phase 2 出 Board，不一次性全做 |

⠀