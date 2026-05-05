# Spec Review Report: Phase 2 全栈升级（7 子 Feature）

## Review Summary
- **Date**: 2026-05-05
- **Reviewer**: Claude Code /review-spec
- **Scope**: feat-phase2 全部 7 个子 feature
- **Overall**: ⚠️ CAUTION — 1 PASS + 6 CAUTION

```
Phase 2 Spec Review
═════════════════════════════════════════════════════════

  PASS (≥80):     3 features
  CAUTION (60-79): 4 features
  BLOCK (<60):     0 features

  Cross-feature Critical: 2
  Cross-feature Warning:  5
  Cross-feature Suggestion: 3
```

## Feature Scores

| # | Feature | D1 Clarity | D2 Complete | D3 Consist | D4 Feasible | D5 Gherkin | Total | Status |
|---|---------|-----------|------------|-----------|------------|-----------|-------|--------|
| 1 | feat-p2-board-scaffold | 18/20 | 12/20 | 18/20 | 20/20 | 16/20 | **84** | ✅ PASS |
| 2 | feat-p2-graphify-index | 14/20 | 12/20 | 18/20 | 20/20 | 18/20 | **82** | ✅ PASS |
| 3 | feat-p2-timeline | 16/20 | 12/20 | 18/20 | 16/20 | 16/20 | **78** | ⚠️ CAUTION |
| 4 | feat-p2-multimodal-ingestion | 12/20 | 8/20 | 16/20 | 20/20 | 20/20 | **76** | ⚠️ CAUTION |
| 5 | feat-p2-board-dashboard | 14/20 | 8/20 | 18/20 | 16/20 | 16/20 | **72** | ⚠️ CAUTION |
| 6 | feat-p2-knowledge-map | 16/20 | 8/20 | 16/20 | 16/20 | 16/20 | **72** | ⚠️ CAUTION |
| 7 | feat-p2-board-explorer | 16/20 | 8/20 | 14/20 | 16/20 | 16/20 | **70** | ⚠️ CAUTION |

## Cross-Feature Critical Issues

### C1: 所有 Feature 缺少错误/异常场景（Sad Path）
- **影响范围**: 全部 7 个 feature
- **维度**: D2 Completeness + D5 Gherkin
- **问题**: 没有 1 个 feature 的 Gherkin 包含 API 失败、空数据、损坏输入等错误路径。历史教训表明 EDITH 项目之前多次因缺少错误场景导致实现时返工（如 feat-tui-context-monitor 的 scenarios_skipped: 1）。
- **影响**: 开发者遇到异常情况时行为未定义，可能导致 UI 白屏或崩溃。
- **建议**: 每个 feature 至少补充 1 个 sad-path scenario：
  - **Board 系列**: 知识仓库路径不存在 / API 返回 500 / WebSocket 断连
  - **Agent 系列**: Python 环境缺失 / graph.json 解析失败 / Vision API 超时

### C2: 依赖链单点故障 — board-scaffold 阻塞 4 个 Feature
- **影响范围**: feat-p2-board-dashboard, feat-p2-board-explorer, feat-p2-knowledge-map, feat-p2-timeline
- **维度**: D4 Feasibility
- **问题**: board-scaffold 是 Phase 2 的瓶颈——它完成后 4 个 Board 页面才能启动。如果 board-scaffold 的 API 设计不稳定，下游 4 个 feature 会连锁修改。
- **建议**: board-scaffold 的 API 契约（8 个端点 + WebSocket 事件格式）应先 freeze 再开始下游开发。在 board-scaffold spec 中补充 API 响应格式 schema。

## Cross-Feature Warnings

### W1: 所有 Feature 缺少显式 Scope Boundary
- **影响范围**: 全部 7 个 feature
- **维度**: D1 Clarity
- **问题**: 没有 feature 明确定义"本 feature 不做什么"。
- **建议**: 每个 spec 补充 Scope 部分，例如：
  - multimodal-ingestion: OUT — 不处理视频文件、不做 OCR 后的语义校验
  - board-scaffold: OUT — 不实现用户认证、不做写入操作

### W2: multimodal-ingestion Python 环境依赖未定义
- **位置**: spec.md Technical Solution
- **维度**: D4 Feasibility
- **问题**: MarkItDown 是 Python 包，但 Agent 是 TypeScript 项目。spec 没有说明 Python 环境如何管理（venv? system Python? bundled?）、版本要求、安装失败回退策略。
- **建议**: 补充 Python 运行时策略（推荐: `python -c "import markitdown"` 检测 → 不存在则降级到仅代码扫描）。

### W3: graphify-index 与 graph.json 格式未定义 Schema
- **位置**: spec.md Technical Solution
- **维度**: D2 Completeness
- **问题**: graph.json 是多个 feature 的核心数据源（knowledge-map 消费它、board-scaffold 解析它），但 spec 没有定义 graph.json 的 JSON Schema。checklist 提到需要"graph.json 格式文档"但 spec 中缺失。
- **建议**: 在 graphify-index spec 中补充 graph.json 的核心结构定义（节点、边、置信度字段）。

### W4: board-explorer 的"多模态产物预览"无 Gherkin 覆盖
- **位置**: task.md §6 + spec.md General Checklist
- **维度**: D3 Consistency
- **问题**: task.md 有"多模态产物预览"任务（图像语义描述展示、OCR 产物展示），spec.md checklist 也列出了"多模态产物预览"，但 Gherkin 中没有任何对应场景。
- **建议**: 补充 Gherkin scenario，或在 scope 中明确标注为"OUT（依赖 multimodal-ingestion 完成后补充）"。

### W5: Board 系列缺少空状态（Empty State）处理
- **影响范围**: dashboard, explorer, knowledge-map, timeline
- **维度**: D2 Completeness
- **问题**: 没有 feature 定义知识库为空时的 UI 状态。新用户第一次打开 Board 时，所有面板都是空的。
- **建议**: 至少 dashboard 补充空状态 scenario："Given 知识库中没有任何服务, Then Dashboard 显示引导提示"。

## Cross-Feature Suggestions

### S1: board-scaffold API 响应格式统一化
- 建议在 board-scaffold spec 中定义统一的 API 响应格式 `{ ok: boolean, data: T, error?: string }`，所有下游 feature 消费一致格式。

### S2: 置信度分级（EXTRACTED / INFERRED / AMBIGUOUS）定义位置
- 置信度分级在 graphify-index 和 knowledge-map 两个 feature 中都出现。建议在 graphify-index spec 中作为权威定义，knowledge-map 引用即可。

### S3: 补充性能预算
- Board 页面首次加载、API 响应时间、图谱渲染帧率都缺少性能指标。建议至少为 board-scaffold 设定 API 响应 < 200ms 的基线。

## Per-Feature Detail

### feat-p2-board-scaffold (84/100 ✅ PASS)
- **亮点**: API 设计清晰、项目结构明确、"Board 只读"原则明确
- **D2 扣分**: 缺少知识仓库不存在的错误场景、缺少 API 性能要求
- **D5 扣分**: 3 个场景全是 happy path，无错误场景

### feat-p2-graphify-index (82/100 ✅ PASS)
- **亮点**: Graphify→EDITH 三层映射表清晰、Token 效率分析具体、增量更新机制完整
- **D1 扣分**: "高价值区域"定义模糊
- **D2 扣分**: graph.json 无 schema、缺少空仓库/超大仓库边界场景

### feat-p2-timeline (78/100 ⚠️ CAUTION)
- **亮点**: 事件类型分类清晰、月份分组 UI 设计直观
- **需修复**: 补充空时间线场景、API 失败场景
- **D4 扣分**: board-scaffold 依赖未完成

### feat-p2-multimodal-ingestion (76/100 ⚠️ CAUTION)
- **亮点**: 摄入管道设计清晰、配置扩展方案完整、隐私模式考虑周全
- **需修复**: Python 环境策略未定义、缺少损坏文件处理场景
- **D1 扣分**: 缺少 scope boundary、缺少转换性能指标

### feat-p2-board-dashboard (72/100 ⚠️ CAUTION)
- **亮点**: UI 布局 mockup 清晰、数据来源表完整
- **需修复**: 补充空状态场景、WebSocket 断连重连场景、API 超时处理
- **D4 扣分**: board-scaffold 依赖未完成

### feat-p2-knowledge-map (72/100 ⚠️ CAUTION)
- **亮点**: 图谱 mockup 清晰、置信度着色方案直观、双视图切换设计好
- **需修复**: 补充空图谱场景、graph.json 解析失败场景、>50 节点性能要求移入 spec
- **D4 扣分**: 双重依赖（graphify + scaffold）均未完成

### feat-p2-board-explorer (70/100 ⚠️ CAUTION)
- **亮点**: Services/Artifacts 双页面设计清晰、Token 计数显示实用
- **需修复**: "多模态产物预览"task 无 Gherkin 覆盖、补充空服务列表场景
- **D3 扣分**: spec-task 不对齐

## Archive Context Used
- Level 1: 42 features scanned from archive-log.yaml
- Level 2: Top 5 features deep-loaded for historical lessons
- Key lessons applied:
  - pi SDK 功能假设导致返工（feat-packaging: pi-package.yaml 不存在）
  - TUI 组件与 Session 耦合问题（建议 Board 组件与 API 解耦）
  - 缺少跨组件集成测试是主要测试盲点

## Overall Assessment

Phase 2 的 7 个 feature 整体设计质量不错——API 契约、UI 布局、数据流向都定义清楚了。**主要风险不在单个 feature 内部，而在跨 feature 的一致性和依赖链。**

**优先修复建议（按影响排序）：**

1. **board-scaffold API freeze**（阻塞下游 4 个 feature）— 补充 API 响应格式 schema + 错误码定义
2. **所有 feature 补充 1-2 个 error scenario**（C1）— 防止实现时行为未定义
3. **multimodal-ingestion Python 策略**（W2）— 决定 Python 环境管理方式
4. **graph.json schema 定义**（W3）— graphify-index 为权威来源，knowledge-map 消费

修复以上 4 点后，所有 feature 预计可提升到 80+ 分。
