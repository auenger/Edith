---
name: edith-distillator
description: EDITH 分支 Skill。无损文档蒸馏压缩，将 EDITH 索引的文档压缩为 Agent 可高效消费的精简版。是 EDITH "索引不倾倒"原则的工具化实现。支持语义拆分、EDITH 技能蒸馏模式和往返验证。
---

# Edith Distillator — 文档蒸馏引擎

EDITH 的分支 Skill，是 EDITH 工作原则 **"索引不倾倒"** 的工具化实现。将 document-project 扫描生成的大量文档压缩为 Agent 可高效消费的精简版，**无损压缩而非摘要**。

## 在 EDITH 中的定位

```
EDITH 文档生命周期：

  代码考古（document-project）
    ↓ 生成全套项目文档（可能很大）

  文档蒸馏（本 Skill）           ← 你在这里
    ↓ 压缩为 Agent 可消费的精简版
    ↓ 按主题拆分，每个模块/服务一个分片
    ↓ 每个分片自包含，Agent 按需加载

  技能生成（EDITH BOOTSTRAP SKILLS）
    ↓ 蒸馏版 → Repo Skill / Workflow Skill / Source Skill Stub
```

**与 EDITH 理念的对应**：

| EDITH 工作原则 | 本 Skill 的实现 |
|---|---|
| 索引不倾倒 | 无损压缩，只保留信号，去除冗余 |
| 模式优先于日志 | 提取决策、约束、关系，不是流水账 |
| 仓库真相留在仓库 | 蒸馏版指向源文件，不替代它 |
| 为交接而构建 | 蒸馏版自包含，新 Agent 可直接使用 |

## 核心概念

- **摘要（Summarization）**：有损的，丢掉细节
- **蒸馏（Distillation）**：无损的，保留每个事实、决策、约束，只去掉 Agent 不需要的冗余

典型压缩比 3:1 以上，大幅减少 token 消耗。

---

## 触发方式

当用户说：
- "蒸馏这些文档"
- "压缩项目文档"
- "把文档精简给 AI 用"
- "生成蒸馏版"
- "为 EDITH 蒸馏"

---

## 启动参数

| 参数 | 必须 | 说明 |
|------|------|------|
| source_documents | 是 | 文件路径、目录路径或 glob 模式 |
| downstream_consumer | 否 | 下游用途（如 "PRD 创建"、"架构设计"），用于判断什么该留什么该去 |
| token_budget | 否 | 目标 token 数，超出则触发语义拆分 |
| output_path | 否 | 输出路径，默认在源文件旁生成 `-distillate.md` |
| --validate | 否 | 生成后做往返验证（代价高，仅关键文档使用） |
| --edith-mode | 否 | EDITH 技能蒸馏模式（见下方说明） |
| --quick-ref | 否 | 速查卡模式，生成 Layer 1 速查卡（~5% 源文，<2000 token） |

### 速查卡模式（--quick-ref）

生成极速参考卡（Layer 1），目标压缩至源文的 ~5%。

`--quick-ref` 与 `--edith-mode` 正交：
- `--edith-mode` 控制**为谁蒸馏**（下游消费者身份）
- `--quick-ref` 控制**输出多细**（输出粒度）
- 两者可组合：`--quick-ref --edith-mode=repo-skill` = 为 Repo Skill 生成速查卡版本

| 命令 | 输出 |
|------|------|
| `distillator source.md` | 完整蒸馏版（~30%） |
| `distillator --quick-ref source.md` | 通用速查卡（~5%） |
| `distillator --edith-mode=repo-skill source.md` | Repo Skill 蒸馏版（~15%） |
| `distillator --quick-ref --edith-mode=repo-skill source.md` | Repo Skill 速查卡（~5%，偏向接口和验证） |

速查卡使用固定结构（不按主题分组）：
- Verify：精确的构建/测试/运行/lint 命令
- Key Constraints：Top 5 硬约束
- Pitfalls：Top 5 易错点（格式："症状 — 原因"）
- API Endpoints：表格，每行一句话（无 schema）
- Data Models：每模型一行（名称 + 用途 + 2-3 关键字段）
- Deep Dive：指向完整蒸馏版分片的路径

速查卡输出到 `{name}-quick-ref.md`，与蒸馏版同级目录。
压缩规则见 `resources/quick-ref-rules.md`。

### EDITH 技能蒸馏模式（--edith-mode）

当指定 `--edith-mode` 时，自动根据目标技能类型调整蒸馏策略：

| 模式值 | downstream_consumer 等效 | 保留重点 | 去除重点 |
|---|---|---|---|
| `repo-skill` | edith-repo-skill | 接口契约、数据模型、构建命令、关键约束 | 环境搭建细节、迁移历史、所有 TODO |
| `workflow-skill` | edith-workflow-skill | 业务流程、阶段定义、集成点、成功标准 | 代码实现细节、文件路径 |
| `source-skill` | edith-source-skill | 访问路径、搜索策略、路由规则、Owner | 具体内容、配置细节 |
| `entry` | edith-entry | 路由表、快速参考、模块索引 | 所有详细内容 |

EDITH 模式下的额外规则：
- 源文件路径必须是相对路径（保证蒸馏版可移植）
- 每个分片开头必须包含 "本分片对应 EDITH 技能：{类型}"
- 不确定的内容保留但标注 `[未确认]`，不删除

---

## 执行流程

### Stage 1：分析

分析源文件：
- 统计文件数量和大小
- 估算 token 数（约 4 字符 = 1 token）
- 检测文档类型（brief、PRD、架构文档、研究笔记等）
- 按命名关联分组（如 brief + discovery-notes）
- 决定路由策略：
  - **single**：≤3 文件 且 ≤15K token → 单次压缩
  - **fan-out**：>3 文件 或 >15K token → 分组压缩后合并

### Stage 2：压缩

#### 提取

从所有源文档中提取每一个离散信息：
- 事实和数据点（数字、日期、版本、百分比）
- 决策及其理由
- 被拒绝的方案及原因
- 需求和约束（显式和隐式）
- 实体间的关系和依赖
- 命名实体（产品、公司、技术）
- 未决问题和待办事项
- 范围边界（包含/排除/延期）
- 成功标准和验证方法
- 风险和机会

#### 去重

- 同一事实多次出现 → 保留上下文最丰富的版本
- 同一概念不同详细程度 → 保留详细版
- 重叠列表 → 合并去重
- 源文档冲突 → 明确标注："文档 A 说 X；文档 B 说 Y — 未解决"

#### 过滤（仅在指定了 downstream_consumer 时）

- 丢弃与下游用途明显无关的内容
- **永不丢弃**：决策、被拒方案、未决问题、约束、范围边界

#### 主题分组

按源内容自然分组，不用固定模板。常见分组：
- 核心概念/问题/动机
- 方案/架构
- 用户/角色
- 技术决策/约束
- 范围边界
- 被拒方案
- 未决问题
- 风险和机会

#### 压缩语言

应用压缩规则（见 `resources/compression-rules.md`）：
- 删除过渡语和修辞
- 删除犹豫和模糊表达
- 删除常识解释
- 保留具体细节（数字、名称、版本）
- 每条信息自包含，无需阅读源文档即可理解

### Stage 3：输出

#### 单文件蒸馏版（≤5000 token）

```yaml
---
type: edith-distillate
sources:
  - "相对路径/到/源文件1.md"
  - "相对路径/到/源文件2.md"
downstream_consumer: "用途说明"
created: "日期"
token_estimate: 估算token数
parts: 1
---

## 主题1
- 密集信息点1
- 密集信息点2; 关联信息点3

## 主题2
- 密集信息点4
```

#### 拆分蒸馏版（>5000 token 或 token_budget 要求）

```
{名称}-distillate/
├── _index.md           # 导向、跨主题项、分片清单
├── 01-{主题slug}.md    # 自包含的主题分片
├── 02-{主题slug}.md
└── 03-{主题slug}.md
```

**_index.md 包含**：
- 3-5 条引导信息（蒸馏了什么、从哪些文件、给谁用、几部分）
- 分片清单：每个文件名 + 一行描述
- 跨主题项

**每个分片自包含**：
- 1 行上下文头：本分片覆盖 [主题]。第 N/M 部分。
- 按主题组织的密集信息点

#### 速查卡输出（--quick-ref）

```yaml
---
type: edith-quick-ref
layer: 1
target_service: "服务名"
sources:
  - "相对路径/到/源文件.md"
created: "日期"
token_budget: 2000
---
```

固定结构（不按主题分组）：
- **Verify**: 构建命令 / 测试命令 / 运行命令 / Lint 命令（可复制粘贴）
- **Key Constraints**: Top 5 不可违反的约束
- **Pitfalls**: Top 5 易错点（"症状 — 原因"）
- **API Endpoints**: Method / Path / Purpose 三列表，每行一句话
- **Data Models**: 每模型一行（名称 + 用途 + 2-3 关键字段）
- **Deep Dive**: 指向完整蒸馏版分片的路径

输出到 `{name}-quick-ref.md`，严格 <2000 token。

### Stage 4：往返验证（仅 --validate）

可选，用于验证蒸馏版是否真的无损：

1. 将蒸馏版交给一个**没有看过源文档的** Agent
2. 让它从蒸馏版反推出源文档
3. 对比反推结果和原始文档：
   - 核心信息是否保留？
   - 具体细节（数字、名称）是否准确？
   - 关系和理由是否完整？
   - 是否有编造的内容？
4. 生成验证报告

---

## 输出格式规则

- 只用 `##` 标题和 `- ` 列表项
- 没有散文段落
- 没有装饰性格式（加粗强调、分割线）
- 没有重复信息
- 每条信息自包含
- 用分号连接紧密相关的短信息

---

## 压缩规则速查

### 完全删除

- 过渡语："如前所述"、"值得注意的是"
- 修辞："这是颠覆性的"、"令人兴奋的是"
- 犹豫："我们认为"、"可能"、"似乎"
- 自指："本文描述了"、"如上所述"
- 常识解释
- 重复引入同一概念
- 格式装饰

### 必须保留

- 具体数字、日期、版本、百分比
- 命名实体
- 决策及理由（压缩为："决策：X。理由：Y"）
- 被拒方案及原因
- 明确约束和不可妥协项
- 依赖和顺序关系
- 未决问题
- 范围边界
- 风险及严重程度

### 转换规则

- 散文段落 → 单条密集信息点
- "我们决定用 X 因为 Y 和 Z" → "X（理由：Y, Z）"
- 重复分类标签 → 合并到同一标题下
- 多句解释 → 分号分隔压缩形式
- 详细列举 → 括号列表："平台（Cursor, Claude Code, Windsurf）"

---

## 语义拆分策略

当必须拆分时，按自然语义边界而非大小：

1. **识别自然边界**：不同问题域、不同视角、时间边界、范围边界
2. **分配信息到分片**：跨分片的放 _index.md，分片特定的放分片
3. **每个分片自包含**：只加载一个分片就能理解该主题
4. **大小目标**：每个分片 3000-5000 token

---

## 典型使用场景

### 场景1：压缩项目文档给 Agent 用

```
输入：docs/ 目录下的所有文档（架构、API、数据模型等，共 30K token）
输出：docs-distillate/（压缩到约 10K token，按主题拆分）
用途：Agent 开发新功能时只加载相关分片
```

### 场景2：压缩需求文档

```
输入：PRD + 用户研究笔记 + 竞品分析（共 20K token）
输出：product-distillate.md（压缩到约 6K token）
用途：架构设计时作为上下文输入
```

### 场景3：压缩会议记录

```
输入：5 份会议纪要（共 8K token）
输出：meetings-distillate.md（压缩到约 2.5K token）
用途：提取决策和行动项，丢弃过程讨论
```

### 场景4：生成速查卡（Layer 1）

```
输入：某微服务的蒸馏版（约 10K token）
输出：<service>-quick-ref.md（压缩到约 500-2000 token）
用途：日常开发时快速参考，不需要完整蒸馏版
命令：distillator --quick-ref distillates/<service>/
```

### 场景5：三层加载完整流程

```
1. document-project 扫描老项目 → 全套文档
2. distillator --edith-mode=repo-skill → 蒸馏版（按主题拆分）  ← Layer 2
3. distillator --quick-ref → 速查卡                              ← Layer 1
4. 从速查卡提取路由信息 → 路由表                                    ← Layer 0
```

---

## 与 document-project 的配合

```
1. document-project 扫描老项目 → 生成全套文档（可能很大）
2. distillator 蒸馏压缩 → 生成 Agent 可高效消费的精简版
3. Agent 工作时 → 按需加载蒸馏版的对应分片
```
