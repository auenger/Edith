# Feature: feat-excavate-smart-depth 智能深度控制

## Basic Information
- **ID**: feat-excavate-smart-depth
- **Name**: 智能深度控制（自动选择扫描深度）
- **Priority**: 92
- **Size**: S
- **Dependencies**: []
- **Parent**: feat-deep-excavation
- **Children**: []
- **Created**: 2026-04-30

## Description

改造 edith_scan 的深度选择策略：从用户手动选择 Quick/Deep/Exhaustive 变为根据项目规模和类型自动选择最优深度。

核心逻辑：
- **小型项目**（<100 源文件）：自动 Exhaustive，全量读取所有文件
- **中型项目**（100-500 源文件）：自动 Deep，读关键目录 + 高价值文件
- **大型项目**（>500 源文件）：自动识别模块边界，按模块分批 Deep 扫描
- **超大项目**（monorepo / 微服务集群）：自动识别子项目，分别扫描后合并

用户仍可通过参数（`--depth=quick|deep|exhaustive`）手动覆盖自动选择。

## User Value Points

1. 用户无需理解深度级别，Agent 自动选择最优策略
2. 小项目不被浅扫浪费，大项目不会因全量扫描超时

## Context Analysis

### Reference Code
- `edith-skills/document-project/SKILL.md` — 当前三级深度定义（Line 280-288）
- `agent/src/tools/scan.ts` — scan 工具实现中的深度控制逻辑

### Related Documents
- `SKILL.md` 黄金路径 Phase 2 INVENTORY

### Related Features
- `feat-deep-excavation`（父特性）
- `feat-skill-align-scan`（已完成，基础 scan 对齐）

## Technical Solution
<!-- To be filled during implementation -->

核心改动点：
1. **项目规模检测**：在 scan 启动时统计源文件数量（排除 node_modules/.git 等），作为深度决策依据
2. **模块边界识别**：对大项目，通过目录结构 + 配置文件识别模块边界（如 packages/、services/、apps/）
3. **深度策略映射**：规模 → 深度级别的映射表
4. **SKILL.md 更新**：将智能深度控制写入 scan skill 规范

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，当我扫描一个项目时，Agent 根据项目大小自动选择最优扫描深度，无需我手动选择。

### Scenarios (Given/When/Then)

#### Scenario 1: 小项目自动全量
```gherkin
Given 一个包含 50 个源文件的 TypeScript 项目
When 用户调用 edith_scan 不指定深度
Then 自动选择 Exhaustive 深度
And 读取并分析所有 50 个源文件
And 生成的文档包含函数级细节
```

#### Scenario 2: 大项目自动分模块
```gherkin
Given 一个 monorepo 包含 3 个 packages 共 800 个源文件
When 用户调用 edith_scan 不指定深度
Then 自动识别 3 个 package 边界
And 对每个 package 分别执行 Deep 扫描
And 合并生成全局架构文档
```

#### Scenario 3: 手动覆盖
```gherkin
Given 一个中型项目
When 用户调用 edith_scan --depth=exhaustive
Then 忽略自动深度选择
And 强制执行 Exhaustive 全量扫描
```

### General Checklist
- [ ] 规模阈值合理（100/500 文件分界线）
- [ ] monorepo/microservice 识别准确
- [ ] 手动覆盖参数正常工作
- [ ] SKILL.md 已更新深度策略
