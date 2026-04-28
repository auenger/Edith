# EDITH 集成设计 — 全栈知识基础设施架构

> 版本：v1.0\
> 日期：2026-04-28\
> 定位：EDITH 从"代码侧知识引擎"升级为"全栈知识基础设施"的集成规范\
> 前置：EDITH-PRODUCT-DESIGN.md、SCALABILITY-ANALYSIS.md

***

## 一、设计背景

当前 EDITH（Phase 1）是一个面向代码仓库的知识蒸馏引擎，通过三层加载策略（routing-table / quick-ref / distillates）实现了高效的知识生产与路由。但它在三个维度存在结构性缺口：

| 缺口       | 表现                         | 影响                                  |
| -------- | -------------------------- | ----------------------------------- |
| **摄入范围** | `edith_scan` 只处理源代码        | 无法消化企业中大量存在的 PDF、Office 文档、架构图、会议录音 |
| **认知索引** | 三层产物是扁平 Markdown，缺乏图谱级语义关系 | 随服务规模增长，路由表膨胀，跨服务关联靠人工维护            |
| **可视化**  | 仅有终端 TUI，无 Web 界面          | 管理者、非技术角色无法感知知识库状态                  |

本文定义三个集成决策如何系统性地填补这些缺口，并为 Phase 2（EDITH Board）提供数据基础。

***

## 二、三个核心决策

### 决策 1：文档即记忆 — 不自建记忆系统

EDITH 的三层知识产物本身就是结构化记忆，不需要引入 SQLite、JSONL 事件流或独立的 MEMORY.md。

**与 Agent 框架记忆模型的对比：**

| 维度       | Agent 框架记忆（Hermes/OpenClaw）    | EDITH 文档记忆                          |
| -------- | ------------------------------ | ----------------------------------- |
| 存储载体     | SQLite / JSONL / 单文件 MEMORY.md | 三层分级 Markdown                       |
| Token 成本 | 随记忆膨胀无限增长                      | 确定性预算（500 / 2000 / 4000）            |
| 可路由性     | 全量加载或关键词检索                     | 三层查询规则，按需加载                         |
| 人类可审阅    | 黑盒（需要专用工具）                     | 透明（任何文本编辑器）                         |
| 记忆整理     | Dream Pass 夜间全量重扫              | `edith distill --refresh` 按需重蒸      |
| Agent 绑定 | 绑定特定 Agent 框架                  | Agent 无关，任何可读 Markdown 的 Agent 均可消费 |

**记忆映射关系：**

```text
Agent 框架              EDITH 等价物
────────────────────    ──────────────────────────
身份提示词          →    routing-table.md（我是谁、我管什么）
转写日志            →    logs/ 对话导出 + YAML Frontmatter 元数据
运行时事实摘要      →    quick-ref.md（验证命令、关键约束、易错点）
技能库              →    distillates/*.md（自包含的知识片段）
夜间整理            →    edith distill --refresh（增量重蒸）
```

**原则：** 知识资产不绑定 Agent。Agent 会换代，知识不会。

### 决策 2：集成 Graphify — 认知图谱索引引擎

Graphify 作为 EDITH Layer 2 的索引引擎，替代全量文件扫描，提供 AST 级别的语义关系提取。

**在 EDITH 架构中的定位：**

```text
当前流程:
  edith_scan（全量文件扫描）→ edith_distill → 三层产物

增强流程:
  Graphify（索引扫描，生成 graph.json）
    → edith_scan（定向扫描，只看 Graphify 标记的高价值区域）
    → edith_distill → 三层产物
```

**Graphify 产出与 EDITH 三层的映射：**

| Graphify 产出                             | 映射到 EDITH                | 作用                      |
| --------------------------------------- | ------------------------ | ----------------------- |
| `graph.json` 全局拓扑                       | Layer 0 routing-table.md | 自动生成服务间依赖关系，替代人工维护      |
| 实体提取 + 社区聚类                             | Layer 1 quick-ref.md     | 自动识别核心概念节点，生成速查索引       |
| AST 调用图 + 依赖树                           | Layer 2 distillates/*.md | 按调用链拆分蒸馏片段，保证自包含        |
| `GRAPH_REPORT.md`                       | Board Knowledge Map 数据源  | 直接驱动 D3.js 可视化          |
| 置信度分级（EXTRACTED / INFERRED / AMBIGUOUS） | 三层产物标注                   | 让消费者知道：哪些是源码硬逻辑，哪些是语义推断 |

**Token 效率提升：**

三层查询规则使 Agent 不需要每轮对话重新扫描整个 Vault：

```text
第一层：查询 graph.json（全局拓扑）        — 毫秒级，零 Token
第二层：查询 routing-table / quick-ref     — < 2500 Token
第三层：查询 distillates 特定片段           — < 4000 Token / 片段
全量扫描：仅在以上三层均无法解答时触发
```

### 决策 3：引入 MarkItDown + 多模态模型配置

扩展 `edith_scan` 的输入范围，从"纯代码"升级为"全格式企业文档"。

**摄入能力扩展：**

```text
edith_scan 当前:
  源代码（.ts / .py / .go / .java）→ AST + 文本提取 → 项目文档

edith_scan 增强（通过 MarkItDown）:
  源代码      → AST 提取（不变）
  PDF         → MarkItDown + OCR → 结构化 Markdown（保留表格、多级标题）
  Word/Excel  → MarkItDown      → GFM 表格 + 要点列表
  PowerPoint  → MarkItDown      → 按幻灯片编号的要点提取
  图片/架构图  → multimodal LLM  → 语义描述文本
  音频/会议   → MarkItDown 转录 → 带时间戳的纪要
```

**安全考量：**

对于金融、法律等隐私敏感行业，多模态处理可以完全本地化：

```yaml
ingestion:
  markitdown:
    enabled: true
    ocr: true
    vision: true
    # 隐私模式：所有处理不离开内网
    local_mode: true
    vision_endpoint: http://localhost:11434/v1   # 本地部署的 LLM Vision
```

***

## 三、集成后的四层架构

```text
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4 — EDITH Board (Phase 2)                               │
│  可视化与管理层                                                 │
│                                                                 │
│  Dashboard │ Services │ Knowledge Map │ Artifacts │ Timeline   │
│                                                                 │
│  数据源: graph.json + 三层 Markdown 产物 + Git 变更日志          │
│  原则: 只读展示，不修改 Agent 产出物                              │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3 — EDITH Engine                                        │
│  认知蒸馏 + 路由（Phase 1 核心，不变）                           │
│                                                                 │
│  edith_scan  → 代码考古 + 多模态摄入                             │
│  edith_distill → 文档蒸馏，生成三层产物                           │
│  edith_route → 需求路由分析                                      │
│  edith_query → 知识查询                                         │
│                                                                 │
│  记忆模型: 文档即记忆，三层分级，Token 预算确定                    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2 — Graphify                                            │
│  认知图谱索引（集成）                                           │
│                                                                 │
│  tree-sitter AST 提取 → 13+ 语言 + Markdown                    │
│  实体提取 + 社区聚类 → 概念拓扑                                 │
│  graph.json 索引 → 全局视野，避免全量扫描                        │
│  置信度分级 → EXTRACTED / INFERRED / AMBIGUOUS                  │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1 — MarkItDown                                          │
│  多模态数据摄入（集成）                                         │
│                                                                 │
│  PDF / Office / Image / Audio → 结构化 Markdown                │
│  OCR + LLM Vision → "文本 + 语义描述" 双重映射                  │
│  由 edith.yaml 中的 multimodal 配置驱动                         │
└─────────────────────────────────────────────────────────────────┘
```

**数据流全景：**

```text
企业文档资产（源码 / PDF / Office / 图片 / 音频）
    │
    ▼
Layer 1: MarkItDown ─── 多模态 → 结构化 Markdown
    │
    ▼
Layer 2: Graphify ───── 索引扫描 → graph.json + 实体聚类
    │                              + 置信度分级
    ▼
Layer 3: EDITH Engine ─ 定向扫描 → 蒸馏 → 三层产物
    │                                 routing-table  (< 500 token)
    │                                 quick-ref      (< 2000 token)
    │                                 distillates    (< 4000 token/片段)
    │
    ├──────────────────────┐
    ▼                      ▼
Layer 4: EDITH Board    任意 Agent（Claude Code / Copilot / 自研）
    Web 可视化            零适配消费纯 Markdown
```

***

## 四、配置模型扩展

### 4.1 edith.yaml 扩展结构

```yaml
# === 基础 LLM 配置（不变）===
llm:
  provider: deepseek
  model: deepseek-v4-pro

# === 新增：多模态模型配置 ===
multimodal:
  # Vision 模型 — 用于 MarkItDown 的图像/图表理解
  vision:
    provider: openai               # openai | local | anthropic
    model: gpt-4o
    # 本地部署选项（金融/法律等隐私敏感场景）
    # provider: local
    # endpoint: http://localhost:11434/v1
    # model: llava
  # OCR 配置
  ocr:
    provider: azure                # azure | tesseract | local
    # endpoint: ${AZURE_DOC_INTELLIGENCE_ENDPOINT}
    # key: ${AZURE_DOC_INTELLIGENCE_KEY}

# === 新增：摄入层配置 ===
ingestion:
  # MarkItDown 多模态摄入
  markitdown:
    enabled: true
    ocr: true                      # 启用 OCR 插件
    vision: true                   # 启用 LLM Vision 图表理解
    batch_size: 50                 # 批量处理大小
    supported_formats:             # 启用的文件格式
      - pdf
      - docx
      - xlsx
      - pptx
      - png
      - jpg
      - mp3
      - wav
    exclude_patterns:              # 排除规则
      - "*.encrypted.*"
      - "node_modules/**"

  # Graphify 认知图谱
  graphify:
    enabled: true
    languages: [typescript, python, go, java, markdown]
    obsidian_integration: false     # 是否生成 Obsidian 兼容图谱
    cache_dir: .edith/graphify-cache
    rescan_interval: 24h           # 图谱重扫间隔

# === 原有配置（不变）===
workspace:
  root: ./company-edith
  language: zh

repos:
  - name: edith-repo
    path: /Users/ryan/mycode/EDITH-e2e-pilot

agent:
  token_budget:
    routing_table: 500
    quick_ref: 2000
    distillate_fragment: 4000
  auto_refresh: true
  refresh_interval: 24h

context_monitor:
  enabled: true
  thresholds:
    warning: 70
    critical: 85
    emergency: 95
```

### 4.2 TypeScript 配置接口扩展

```typescript
// agent/src/config.ts 新增接口

export interface MultimodalConfig {
  vision: VisionModelConfig;
  ocr: OcrConfig;
}

export interface VisionModelConfig {
  provider: 'openai' | 'local' | 'anthropic';
  model: string;
  endpoint?: string;    // 本地部署端点
  apiKey?: string;      // 可选，优先使用环境变量
}

export interface OcrConfig {
  provider: 'azure' | 'tesseract' | 'local';
  endpoint?: string;
  key?: string;
}

export interface IngestionConfig {
  markitdown: MarkItDownConfig;
  graphify: GraphifyConfig;
}

export interface MarkItDownConfig {
  enabled: boolean;
  ocr: boolean;
  vision: boolean;
  batchSize: number;
  supportedFormats: string[];
  excludePatterns: string[];
}

export interface GraphifyConfig {
  enabled: boolean;
  languages: string[];
  obsidianIntegration: boolean;
  cacheDir: string;
  rescanInterval: string;
}

// 扩展 EdithConfig
export interface EdithConfig {
  llm: LlmConfig;
  multimodal: MultimodalConfig;        // 新增
  ingestion: IngestionConfig;           // 新增
  workspace: WorkspaceConfig;
  repos: RepoConfig[];
  agent: AgentConfig;
  context_monitor: ContextMonitorConfig;
}
```

***

## 五、Phase 2 Board 承接关系

EDITH Board 的 5 个页面与三个集成决策的数据承接：

```text
┌─ Dashboard（总览仪表盘）─────────────────────────────────────┐
│                                                              │
│  知识库健康度 ← 三层产物元数据（完整率、新鲜度）               │
│  服务覆盖率   ← routing-table.md 中注册的服务                 │
│  最近变更     ← Git log + edith_distill 执行记录              │
│  摄入状态     ← MarkItDown 处理统计（已转化/待处理/失败）      │
│                                                              │
├─ Services（服务列表）───────────────────────────────────────┤
│                                                              │
│  服务卡片     ← quick-ref.md 的结构化数据                     │
│  完整度评级   ← Graphify 置信度 + 三层产物完整性检查           │
│  技术栈/Owner ← routing-table.md 条目                        │
│  操作入口     ← [补全 Layer 2] 触发 edith_distill             │
│                                                              │
├─ Knowledge Map（知识图谱）──────────────────────────────────┤
│                                                              │
│  服务依赖图   ← Graphify graph.json（AST 级调用关系）         │
│  概念拓扑     ← Graphify 实体聚类 + 社区检测                  │
│  节点详情     ← quick-ref.md 摘要                            │
│  置信度标注   ← EXTRACTED / INFERRED / AMBIGUOUS 着色         │
│                                                              │
├─ Artifacts（产出物浏览器）─────────────────────────────────┤
│                                                              │
│  文件树       ← 知识仓库 Git 目录结构                         │
│  Markdown 预览 ← 三层产物原文                                │
│  多模态预览   ← MarkItDown 转化产物（含图像语义描述）          │
│  Token 计数   ← 各产物实际 Token 占用 vs 预算                 │
│                                                              │
├─ Timeline（知识时间线）────────────────────────────────────┤
│                                                              │
│  变更事件     ← Git 提交历史 + YAML Frontmatter 时间戳        │
│  扫描记录     ← edith_scan 执行日志                          │
│  蒸馏记录     ← edith_distill 执行日志                       │
│  摄入记录     ← MarkItDown 批处理日志                        │
│  图谱更新     ← Graphify 重扫记录                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Board 技术栈与集成组件的关系：**

| Board 组件     | 技术选型                      | 数据源                      |
| ------------ | ------------------------- | ------------------------ |
| 前端框架         | React + Next.js           | —                        |
| 图谱可视化        | D3.js / react-force-graph | Graphify `graph.json`    |
| Markdown 编辑器 | Monaco Editor             | 三层 Markdown 产物           |
| 后端 API       | Node.js + Fastify         | Git 知识仓库（只读）             |
| 实时推送         | WebSocket                 | Git 文件监听 + Graphify 索引变更 |
| 部署           | Docker / Vercel           | —                        |

***

## 六、实施路线图

### Phase 1.5 — 集成准备（1-2 周）

```text
目标：扩展 EDITH Agent 的摄入能力和索引能力

Week 1:
  □ MarkItDown Python 包集成
    - 封装为 edith_scan 的子模块
    - 实现 PDF / Office / Image 基础转化管道
  □ edith.yaml 配置模型扩展
    - 新增 multimodal 和 ingestion 字段
    - 更新 config.ts 的 TypeScript 接口和校验逻辑
  □ 多模态模型接入
    - 支持 OpenAI / 本地部署两种 Vision 模型
    - OCR 插件集成

Week 2:
  □ Graphify 集成
    - 注册为 EDITH 全局工具
    - 实现 graph.json → routing-table.md 自动生成
    - 实现 AST 调用图 → distillates 片段骨架
  □ 增量更新机制
    - 文件变更检测 → 触发 Graphify 局部重扫
    - MarkItDown 新文件自动摄入
  □ 集成测试
    - 多格式文档摄入 E2E 测试
    - 图谱索引准确性验证
```

### Phase 2 — EDITH Board 基础版（3-4 周）

```text
目标：在浏览器中查看知识库全貌

Week 1-2:
  □ 项目脚手架（Next.js + Fastify API）
  □ Git 知识仓库读取层（只读）
  □ Dashboard 页面
    - 知识库健康度（三层产物完整率）
    - 服务覆盖率（routing-table 统计）
    - 最近变更时间线
    - MarkItDown 摄入状态面板
  □ Services 列表页
    - Graphify 置信度评级
    - 各服务三层产物状态

Week 3-4:
  □ Knowledge Map 页面
    - 消费 Graphify graph.json
    - D3.js 力导向图渲染
    - 服务依赖 + 概念拓扑双视图
  □ Artifacts 文件浏览器
    - Markdown 预览 + Token 计数
    - 多模态产物预览（图像语义描述）
  □ Timeline 知识时间线
  □ 部署配置（Docker Compose）
```

### Phase 3 — 增值与自治（4-6 周）

```text
目标：增量更新、团队协作、知识质量治理

  □ CI/CD 集成 — 代码变更自动触发知识刷新
  □ 增量蒸馏 — 只重蒸变更影响的片段，不全量重跑
  □ 团队协作 — 评论、审批知识回写
  □ 知识质量评分 — 基于 Graphify 置信度的自动化评估
  □ 行业模板 — Fintech / E-commerce / SaaS 预置 Skill
```

***

## 七、与原文章架构的定位差异

本文的集成方案与原文章（OpenClaw/Hermes 主导的 Agent 架构）在哲学层面有一个根本分叉：

| 维度           | 原文章                     | EDITH 方案                  |
| ------------ | ----------------------- | ------------------------- |
| **核心资产**     | Agent 的记忆和技能            | 结构化知识产物（Markdown）         |
| **Agent 角色** | 知识的创造者和消费者              | 知识的消费者之一（非唯一）             |
| **记忆模型**     | Agent 内建（SQLite/JSONL）  | 文档即记忆（三层分级）               |
| **图谱归属**     | Agent 运行时生成             | Graphify 离线预构建，Agent 按需查询 |
| **多模态处理**    | Agent 运行时调用 LLM         | MarkItDown 摄入时预处理，结果持久化   |
| **人类审阅**     | 需要专用工具                  | 任何文本编辑器                   |
| **Agent 绑定** | 绑定特定框架（OpenClaw/Hermes） | Agent 无关                  |

**核心叙事：**

> EDITH 不是又一个 Agent 框架，而是一个结构化知识引擎。它不与 Agent 竞争，而是成为所有 Agent 的上游知识供应商。任何能读 Markdown 的 Agent——无论是 Claude Code、OpenClaw、GitHub Copilot 还是企业自研的 AI 助手——都可以零适配地消费 EDITH 的三层知识产物。\
> 这种"知识资产与 Agent 解耦"的架构，使得企业在 Agent 技术快速迭代的 2026 年，不必因为切换 Agent 框架而丢失积累的知识资产。

***

## 八、风险与缓解

| 风险                        | 影响         | 缓解策略                                          |
| ------------------------- | ---------- | --------------------------------------------- |
| MarkItDown 对复杂 PDF 表格识别不准 | 蒸馏产物质量下降   | 保留原文链接，标注 OCR 置信度，高敏感文档人工复核                   |
| Graphify 索引过时             | 路由决策偏离实际   | `rescan_interval` 定时重扫 + CI/CD webhook 触发增量更新 |
| 多模态本地部署资源消耗大              | 小团队无法承担    | 配置分层：代码扫描用默认，多模态按需开启，可完全关闭                    |
| Board 只读限制影响体验            | 用户期望直接编辑   | 坚持原则：Board 发起的编辑通过 Agent 执行，不绕过知识引擎           |
| graph.json 体积膨胀           | Board 加载变慢 | 按服务/模块分片索引，Board 按需加载可视区域                     |

⠀