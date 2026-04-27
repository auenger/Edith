# Jarvis Skills × JARVIS 理念融合方案

## 核心洞察

两个新 Skill 不是独立的工具，它们恰好填补了 JARVIS 黄金路径中最难的一步：

```
JARVIS 黄金路径：
  1. CLARIFY         → 明确为什么需要 JARVIS
  2. INVENTORY       → 盘点资产、仓库、流程     ← 难点：老项目没有文档，盘点无从下手
  3. CLASSIFY        → 分类哪些可以自动生成
  4. SCAFFOLD        → 生成骨架
  5. BOOTSTRAP SKILLS → 生成技能骨架
  6. CONFIRM         → 人工确认
  7. PILOT-READY     → 试点就绪
  8. GROW BY WRITEBACK → 通过回写成长
```

**document-project 解决的是 INVENTORY 阶段的核心困难**：公司有老项目但没文档，Agent 盘点不了它不了解的东西。document-project 让 Agent 能从代码本身逆向提取信息。

**distillator 解决的是 INVENTORY + SCAFFOLD 阶段的效率问题**：生成的文档太多太大，Agent 读不过来。distillator 把文档压缩到 Agent 可消费的体量。

---

## 映射关系

### document-project → JARVIS 三层技能的种子生成器

| document-project 输出 | 对应的 JARVIS 技能层 | 说明 |
|---|---|---|
| API 契约文档 | **Repo Skill** 的核心内容 | Agent 需要知道这个仓库暴露了哪些接口 |
| 数据模型文档 | **Repo Skill** 的核心内容 | Agent 需要知道这个仓库的数据结构 |
| 业务逻辑文档 | **Workflow Skill** 的种子 | 从 Service 层调用链可以反推出业务流程 |
| 源码树分析 | **Repo Skill** 的入口 | "我在哪？这个仓库干什么？" |
| 技术栈文档 | **Repo Skill** 的工作规则 | build/run/test 命令、依赖版本 |
| 项目概览 | **Source Skill** 的索引 | 帮助 Agent 路由到正确的仓库 |
| 集成架构 | **Workflow Skill** 的骨架 | 跨仓库的数据流和依赖关系 |
| 模块深入文档 | **Repo Skill** 的完整版 | 逐文件级别的操作指南 |

### distillator → JARVIS "索引不倾倒"原则的工具化

JARVIS 的工作原则说："索引，不倾倒。JARVIS 应该路由、摘要、提取模式，而不是复制原文。"

distillator 就是这句话的工具化实现：

| JARVIS 原则 | distillator 的对应 |
|---|---|
| 索引不倾倒 | 无损压缩，只保留信号，去除冗余 |
| 模式优先于日志 | 提取决策、约束、关系，不是流水账 |
| 仓库真相留在仓库 | 蒸馏版指向源文件，不替代它 |
| 为交接而构建 | 蒸馏版是自包含的，新 Agent 可以直接用 |

---

## 融合后的新工作流

### 阶段一：代码考古（对应 JARVIS INVENTORY）

```
document-project 全局扫描（Deep 模式）
  ↓ 生成：tech-stack / architecture / api-contracts / data-models / source-tree

document-project 模块深入（按需）
  ↓ 对关键模块生成 deep-dive 文档
```

### 阶段二：文档蒸馏（对应 JARVIS SCAFFOLD + BOOTSTRAP）

```
distillator 蒸馏压缩
  ↓ 将全套文档压缩为 Agent 可消费的精简版
  ↓ 按主题拆分：每个微服务/模块一个分片
  ↓ 每个分片自包含，Agent 按需加载
```

### 阶段三：技能生成（对应 JARVIS BOOTSTRAP SKILLS）

**这是融合的关键步骤**——从蒸馏后的文档直接生成 JARVIS 三层技能：

```
蒸馏版 api-contracts + data-models + source-tree
  → 生成 Repo Skill Stub（每个仓库一个）

蒸馏版 business-logic + integration-architecture
  → 生成 Workflow Skill Stub（每个业务闭环一个）

蒸馏版 project-overview + tech-stack
  → 生成 Source Skill Stub（每个数字资产一个）

蒸馏版 index
  → 生成 Company JARVIS Entry Skill Stub
```

### 阶段四：人工确认（对应 JARVIS CONFIRM）

带着生成的技能 Stub 找人确认：
- 仓库角色和维护者对不对
- 业务流程边界准不准
- 接口契约是否完整
- Owner 分配合不合适

### 阶段五：回写成长（对应 JARVIS GROW BY WRITEBACK）

```
Agent 在真实工作中使用 Repo Skill
  ↓ 发现文档不准确或缺失
  ↓ 回写更新到 Repo Skill
  ↓ 定期用 distillator 重新蒸馏
```

---

## 具体结合设计

### 1. document-project 增加一个输出：技能种子

在全局扫描完成后，除了生成文档，额外输出一份 `skills-seed.md`：

```markdown
## 推荐的 Repo Skills

### {repo_name}-repo-skill
- 触发条件：任务涉及 {repo_name} 仓库
- 核心内容来源：api-contracts.md + data-models.md + source-tree.md
- 建议位置：{repo_path}/.claude/JARVIS.md

## 推荐的 Workflow Skills

### {workflow_name}-workflow-skill
- 触发条件：需要完成 {workflow} 流程
- 涉及仓库：{repos}
- 核心内容来源：business-logic.md + integration-architecture.md
```

### 2. distillator 增加 JARVIS 蒸馏模式

专门为 JARVIS 场景设计的蒸馏配置：

```yaml
downstream_consumer: "jarvis-repo-skill"
# 只保留 Agent 操作仓库需要的信息：
# - 接口契约（不保留实现细节）
# - 数据模型（不保留迁移历史）
# - 构建验证命令（不保留环境搭建步骤）
# - 关键约束和反模式（不保留所有 TODO）
```

### 3. 统一入口

在 JARVIS 的黄金路径中，Phase 2 INVENTORY 环节增加代码考古步骤：

```
Phase 2 — INVENTORY
  2a. 盘点已有文档和数字资产（原流程）
  2b. 对无文档的老项目运行 document-project（新增）
  2c. 对生成的文档运行 distillator（新增）
  2d. 从蒸馏结果生成技能种子（新增）
```

---

## 成熟度映射

| 成熟度级别 | document-project | distillator | JARVIS |
|---|---|---|---|
| Pilot-ready | Quick Scan 全局扫描 | 不需要 | 骨架 + 技能 Stub |
| Operational | Deep Scan + 模块深入 | 蒸馏关键文档 | 确认后的技能 + 第一轮回写 |
| Mature | 持续更新（代码变更时重新扫描） | 定期重新蒸馏 | 真实的组织记忆 |

---

## 下一步建议

1. ~~**给 document-project 的 SKILL.md 增加技能种子生成步骤**~~ ✅ 已完成（Scaffold 边界纪律 + JARVIS 定位）
2. ~~**给 distillator 的 SKILL.md 增加 JARVIS 蒸馏模式**~~ ✅ 已完成（--jarvis-mode 参数 + JARVIS 定位）
3. **在 JARVIS 的黄金路径 Phase 2 中引用这两个 Skill** — 待做
4. **用一个真实老项目验证完整流程** — 待做

---

## 关键纪律总结

**不冲突，是天然补充。** 两个 Skill 遵守与 JARVIS 完全一致的边界：

> document-project 提取的是**代码中存在的事实**，不是代码中不存在的历史。
>
> 从提取出的文档到成熟知识，必须走 JARVIS 的回写路径：
> Scaffold → 人工确认 → 试点 → 回写 → Mature Knowledge

这与 JARVIS 的成熟度模型完全对齐：
- document-project 帮你跳到 **Pilot-ready**
- 但不会假装你已经 **Mature**
- Mature 必须通过 Phase 8 的 START → WORK → END 回写来长出来
