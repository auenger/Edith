---
name: jarvis-requirement-router
description: JARVIS 分支 Skill。需求路由前置分析，判断用户需求是否需要加载 JARVIS 上下文以及加载哪一层。是三层加载策略（Layer 0/1/2）的决策入口，防止不必要的上下文加载。
---

# Jarvis Requirement Router — 需求路由前置分析

JARVIS 的分支 Skill，是三层加载策略的**决策入口**。在 Agent 开始工作前，用最小成本（仅读 Layer 0 路由表，<500 token）判断需求是否需要加载额外上下文、加载哪一层，**防止不必要的上下文浪费**。

## 在 JARVIS 中的定位

```
三层加载策略：

  本 Skill（需求路由）              ← 你在这里
    ↓ 判断需求类型
    ↓ 决定加载策略

  Layer 0 路由表（常驻, <500 token）
    ↓ 确定涉及哪些服务

  Layer 1 速查卡（按需, <2000 token）
    ↓ 服务级快速参考

  Layer 2 蒸馏片段（按需, <1000 token/片段）
    ↓ 具体接口/模型细节
```

**与 JARVIS 理念的对应**：

| JARVIS 工作原则 | 本 Skill 的实现 |
|---|---|
| 索引不倾倒 | 先判断再加载，不全量推送 |
| Pilot-First | 路由决策基于最小信息（路由表） |
| 模式优先于日志 | 判断基于信号模式，不是逐字分析 |

## 核心原则

1. **最小前提** — 只依赖 Layer 0 路由表做判断，不预加载任何额外上下文
2. **宁可多问** — 不确定时选择加载，而非跳过
3. **快速决策** — 判断过程不超过 1 轮分析，不反复推理
4. **透明可追溯** — 每个决策都有理由，Agent 和用户都能理解为什么这样加载

## 触发方式

当用户提出需求时，Agent **自动**先运行本 Skill 的判断逻辑，再决定后续行为。

也可以显式触发：
- "分析一下这个需求需要什么上下文"
- "这个需求要加载 JARVIS 吗"
- "帮我路由这个需求"

---

## 输入

| 参数 | 必须 | 说明 |
|------|------|------|
| requirement | 是 | 用户的需求描述（自然语言） |
| routing_table | 隐含 | Layer 0 路由表（常驻上下文中，不需要额外加载） |

---

## 执行流程

### Stage 1：信号提取

从需求描述中提取以下信号：

**服务名匹配**：
- 需求中是否直接提到路由表中的服务名？
- 需求中是否提到与某个服务强关联的业务术语？

**动作类型**：
- `crud`：增删改查、加字段、改状态
- `api-change`：改接口、加参数、改返回值
- `cross-service`：联调、同步、跨服务、数据流转
- `new-service`：新建微服务、拆分服务
- `incident`：故障、报警、线上问题、回滚
- `refactor`：重构、迁移、升级、替换

**复杂度信号**：
- 涉及的实体数量（1 个 vs 多个）
- 是否需要协调多个团队或系统
- 是否有前置依赖
- 是否影响已有接口的兼容性

### Stage 2：路由决策

基于信号进行路由：

```text
服务名匹配数 = 0 且 动作 ≠ cross-service/new-service
  → decision: direct
  → 不加载额外上下文

服务名匹配数 = 1 且 动作 = crud 且 无复杂度信号
  → decision: direct
  → 不加载额外上下文

服务名匹配数 = 1 且 (动作 = api-change/refactor 或 有复杂度信号)
  → decision: quick-ref
  → 加载该服务 Layer 1 速查卡

服务名匹配数 ≥ 2 或 动作 = cross-service
  → decision: multi-service
  → 加载涉及服务的 Layer 1 速查卡

动作 = api-change 且 需要具体 Schema 细节
  → decision: deep-dive
  → 加载 Layer 1 + 指向的 Layer 2 片段

动作 = incident
  → decision: quick-ref
  → 紧急场景先加载速查卡快速定位

动作 = new-service
  → decision: direct
  → 新服务不需要 JARVIS 上下文，参考项目模板

不确定？
  → decision: quick-ref
  → 宁可多加载，不跳过
```

### Stage 3：输出路由指令

---

## 输出格式

```yaml
decision: direct | quick-ref | multi-service | deep-dive
services:
  - name: <service-name>
    layer: 0 | 1 | 2
    reason: "<为什么需要加载这个服务>"
    load: "<具体文件路径>"
confidence: high | medium | low
suggestion: "<一句话建议>"
```

### 四种决策的含义

| 决策 | 含义 | 加载内容 | 典型场景 |
|------|------|---------|---------|
| `direct` | 直接工作 | 无额外加载 | 单服务 CRUD、新增微服务 |
| `quick-ref` | 加载速查卡 | 1 个 Layer 1 | 改接口、重构、事故排查 |
| `multi-service` | 多服务加载 | N 个 Layer 1 | 跨服务联调、数据同步 |
| `deep-dive` | 深入查询 | Layer 1 + Layer 2 片段 | 改接口 Schema、数据模型变更 |

### 输出示例

#### direct（直接工作）

```yaml
decision: direct
services:
  - name: user-service
    layer: 0
    reason: "单服务 CRUD 操作，无需额外上下文"
    load: null
confidence: high
suggestion: "直接在代码中实现，完成后验证即可"
```

#### quick-ref（加载速查卡）

```yaml
decision: quick-ref
services:
  - name: order-service
    layer: 1
    reason: "需要修改订单接口，了解现有约束"
    load: "skills/order-service/quick-ref.md"
confidence: high
suggestion: "先读速查卡了解约束和易错点，再开始改接口"
```

#### multi-service（多服务加载）

```yaml
decision: multi-service
services:
  - name: order-service
    layer: 1
    reason: "订单创建流程需要调用库存和支付"
    load: "skills/order-service/quick-ref.md"
  - name: inventory-service
    layer: 1
    reason: "需要扣减库存，了解接口契约"
    load: "skills/inventory-service/quick-ref.md"
  - name: payment-service
    layer: 1
    reason: "需要发起支付，了解集成方式"
    load: "skills/payment-service/quick-ref.md"
confidence: medium
suggestion: "加载三个服务的速查卡，注意数据一致性问题"
```

#### deep-dive（深入查询）

```yaml
decision: deep-dive
services:
  - name: order-service
    layer: 1
    reason: "需要修改订单数据模型，了解完整 Schema"
    load: "skills/order-service/quick-ref.md"
  - name: order-service
    layer: 2
    reason: "需要完整的订单数据模型定义和接口契约"
    load: "distillates/order-service/03-data-models.md"
confidence: high
suggestion: "先读速查卡了解约束，再深入数据模型片段修改 Schema"
```

---

## 典型场景

### 场景 1：日常小需求

```text
需求："给用户表加一个 phone 字段"
信号：user-service（1 个）, crud（低复杂度）
决策：direct
加载：无
```

### 场景 2：改接口

```text
需求："修改订单创建接口，增加优惠券参数"
信号：order-service（1 个）, api-change（中复杂度）
决策：quick-ref
加载：skills/order-service/quick-ref.md
```

### 场景 3：跨服务联动

```text
需求："订单支付成功后自动扣减库存并通知物流"
信号：order/inventory/payment/logistics（4 个）, cross-service（高复杂度）
决策：multi-service
加载：4 个服务的 quick-ref.md
```

### 场景 4：紧急事故

```text
需求："线上订单创建接口 500 报错，紧急排查"
信号：order-service（1 个）, incident（紧急）
决策：quick-ref（优先快速定位）
加载：skills/order-service/quick-ref.md
```

### 场景 5：数据模型变更

```text
需求："重构订单数据模型，增加子订单支持"
信号：order-service（1 个）, refactor（高复杂度，需要 Schema 细节）
决策：deep-dive
加载：quick-ref.md + distillates/order-service/03-data-models.md
```

---

## 置信度规则

| 置信度 | 条件 | 行为 |
|--------|------|------|
| `high` | 服务名明确匹配 + 动作类型清晰 | 按决策执行 |
| `medium` | 服务名部分匹配 或 动作类型模糊 | 按决策执行，但提示用户确认 |
| `low` | 服务名不匹配 或 需求描述模糊 | 提示用户确认涉及哪些服务后再执行 |

---

## 与其他 Skill 的关系

```text
requirement-router（本 Skill）
  ↓ 输出路由决策

distillator --quick-ref
  ↓ 生成 Layer 1 速查卡

distillator
  ↓ 生成 Layer 2 蒸馏片段

document-project
  ↓ 生成原始项目文档（蒸馏的输入）
```

本 Skill 不生成任何文档，只做决策。它是 Agent 工作流的"调度员"，不是"执行者"。
