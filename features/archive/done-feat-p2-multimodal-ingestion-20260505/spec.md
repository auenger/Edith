# Feature: feat-p2-multimodal-ingestion MarkItDown 多模态摄入

## Basic Information
- **ID**: feat-p2-multimodal-ingestion
- **Name**: MarkItDown 多模态摄入
- **Priority**: 85
- **Size**: S
- **Dependencies**: []
- **Parent**: feat-phase2
- **Children**: []
- **Created**: 2026-04-29

## Description
扩展 `edith_scan` 的输入范围，从"纯代码"升级为"全格式企业文档"。通过集成 MarkItDown Python 包，支持 PDF、Word、Excel、PowerPoint、图片等格式的结构化摄入，输出为纯 Markdown。

### 来源
- EDITH-INTEGRATION-DESIGN.md 决策 3：引入 MarkItDown + 多模态模型配置

## User Value Points
1. **全格式文档摄入** — 用户可以扫描非代码文档（PDF 设计稿、API 合同 Word、架构图图片），将其转化为 EDITH 知识产物
2. **LLM Vision 图表理解** — 图片/架构图通过多模态 LLM 生成语义描述文本
3. **隐私模式** — 金融/法律等敏感行业可完全本地化处理

## Context Analysis
### Reference Code
- `agent/src/tools/scan.ts` (2690 行) — edith_scan 主实现，`executeScan()` 入口函数，需扩展文件格式检测和路由逻辑。现有 `classifyProject()` / `detectArchitecture()` / `extractApiContracts()` 可复用
- `agent/src/config.ts` (1088 行) — `EdithConfig` 接口定义 + `validateConfig()` 校验逻辑 + `DEFAULT_*` 常量模式。新增 `MultimodalConfig` / `IngestionConfig` / `MarkItDownConfig` 应遵循 `LlmProfile` → `LlmConfig` 嵌套模式
- `agent/src/extension.ts` (822 行) — 工具注册中心，`pi.registerTool()` 模式。edith_scan handler 需扩展以支持新的 format 参数
- `agent/src/tools/distill.ts` (1365 行) — 蒸馏管道，多模态产物输出为 Markdown 后统一进入 `executeDistill()` 五步流水线
- `agent/src/tools/explore.ts` (436 行) — 项目浏览器，其文件遍历逻辑可参考用于多格式文件发现

### Related Documents
- EDITH-INTEGRATION-DESIGN.md §决策3、§四、§六 Phase 1.5
- EDITH-PRODUCT-DESIGN.md §2.3 Extension 设计

### Related Features
- feat-tool-scan (已完成 2026-04-27) — edith_scan 基础实现，本 feature 扩展其摄入管道。scan.ts 中 `ScanResult` / `ScanParams` 类型定义为本 feature 的扩展基线
- feat-config-management (已完成 2026-04-27) — edith.yaml 配置加载 + 校验模式。新增配置字段需遵循 `validateConfig()` 校验模式和 `applyDefaults()` 默认值填充模式
- feat-extension-core (已完成 2026-04-27) — 工具注册路由层，edith_scan handler 扩展需同步更新注册逻辑
- feat-cross-platform-support (已完成 2026-04-30) — 跨平台模式：所有路径使用 `path.join()`，Python 调用需使用平台感知的 spawn（参考 `subagent.ts` 模式）

## Technical Solution

### 摄入管道扩展
```
当前: 源代码 → AST + 文本提取 → 项目文档
增强: 源代码 → AST 提取（不变）
      PDF → MarkItDown + OCR → 结构化 Markdown
      Word/Excel → MarkItDown → GFM 表格 + 要点列表
      PowerPoint → MarkItDown → 按幻灯片编号的要点提取
      图片/架构图 → multimodal LLM → 语义描述文本
      音频 → MarkItDown 转录 → 带时间戳的纪要
```

### 配置扩展 (edith.yaml)
```yaml
multimodal:
  vision:
    provider: openai | local | anthropic
    model: gpt-4o
  ocr:
    provider: azure | tesseract | local

ingestion:
  markitdown:
    enabled: true
    ocr: true
    vision: true
    batch_size: 50
    supported_formats: [pdf, docx, xlsx, pptx, png, jpg, mp3, wav]
    exclude_patterns: ["*.encrypted.*", "node_modules/**"]
```

### TypeScript 接口扩展
- `MultimodalConfig` — vision/ocr 配置
- `IngestionConfig` — markitdown/graphify 配置
- `MarkItDownConfig` — 格式、批量大小、排除规则

### Python 环境策略
```
检测流程:
  1. 执行 python3 -c "import markitdown" 检测 MarkItDown 可用性
  2. 可用 → 启用多模态摄入管道
  3. 不可用 → 降级到仅代码扫描，打印 info 日志 "MarkItDown not available, skipping non-code files"

安装:
  - 推荐: pip install markitdown（用户自行安装，edith.yaml 配置确认）
  - 不自动安装 Python 依赖，避免污染用户环境
  - edith.yaml ingestion.markitdown.enabled 可显式禁用
```

### Scope
**IN**: PDF/Office/图片摄入 + LLM Vision 语义描述 + OCR + 本地隐私模式 + edith_scan 扩展 + 配置向后兼容
**OUT**: 视频文件处理、音频转录（V2 预留）、OCR 后的语义校验、批量并发优化

## Acceptance Criteria (Gherkin)
### User Story
作为 EDITH 用户，我希望能够扫描 PDF 和 Office 文档，让它们也被纳入知识库。

### Scenarios
```gherkin
Scenario: 扫描包含 PDF 的项目目录
  Given 用户有一个包含 .pdf 和 .py 文件的项目目录
  When 用户执行 edith_scan 扫描该项目
  Then PDF 文件通过 MarkItDown 转化为结构化 Markdown
  And Python 文件仍然通过 AST 提取（不变）
  And 两种来源的文档统一进入蒸馏管道

Scenario: 扫描包含架构图的目录
  Given 用户有一个包含 PNG 架构图的项目目录
  And edith.yaml 中 multimodal.vision 已配置
  When 用户执行 edith_scan 扫描该项目
  Then 图片通过 LLM Vision 生成语义描述文本
  And 描述文本作为 Layer 2 蒸馏片段的一部分

Scenario: 本地隐私模式处理
  Given edith.yaml 中 multimodal.vision.provider 设为 local
  And 本地部署了 LLM Vision 服务
  When 用户扫描包含图片的项目
  Then 所有图片处理不离开内网
  And 不调用任何外部 API

Scenario: 配置中禁用多模态
  Given edith.yaml 中 ingestion.markitdown.enabled 为 false
  When 用户扫描项目
  Then 只处理源代码文件，忽略 PDF/Office/图片

Scenario: Python 环境不可用时的降级
  Given 系统中未安装 Python 3 或 MarkItDown 包
  And edith.yaml 中 ingestion.markitdown.enabled 为 true
  When 用户扫描包含 PDF 文件的项目
  Then 打印 info 日志 "MarkItDown not available, skipping non-code files"
  And 跳过所有非代码文件，仅处理源代码
  And 不中断扫描流程

Scenario: 损坏文件优雅跳过
  Given 用户项目目录中包含一个损坏的 PDF 文件（无法解析）
  When 用户执行 edith_scan 扫描该项目
  Then 损坏的 PDF 被跳过并记录 warning 日志（含文件名和错误原因）
  And 其他文件正常处理，扫描不中断
```

### General Checklist
- [ ] MarkItDown Python 包作为子模块集成
- [ ] edith_scan 工具新增 format 检测和路由逻辑
- [ ] config.ts 新增 MultimodalConfig 和 IngestionConfig 接口
- [ ] edith.yaml 支持新配置字段且向后兼容
- [ ] 支持 OpenAI / Anthropic / 本地部署三种 Vision 模型
- [ ] OCR 插件集成
- [ ] 错误处理：不支持的格式优雅跳过并记录日志

## Merge Record

- **Completed**: 2026-05-05T10:50:00+08:00
- **Merged Branch**: feature/p2-multimodal-ingestion
- **Merge Commit**: 9753be65602ff70b5fe02ca11252fed62a26f40e
- **Archive Tag**: feat-p2-multimodal-ingestion-20260505
- **Conflicts**: none
- **Verification**: passed (28/28 tests, 6/6 Gherkin scenarios, 0 regressions)
- **Stats**: 5 files changed, 1453 insertions, 1 commit
