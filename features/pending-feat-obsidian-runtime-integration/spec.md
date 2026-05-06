# Feature: feat-obsidian-runtime-integration Obsidian Runtime 集成

## Basic Information
- **ID**: feat-obsidian-runtime-integration
- **Name**: Obsidian Runtime 集成（Agent 运行时接入已完成的 Obsidian 工具）
- **Priority**: 75
- **Size**: S
- **Dependencies**: [feat-p3-obsidian-vault]
- **Parent**: null
- **Children**: []
- **Created**: 2026-05-06

## Description

Obsidian Vault 工具代码已完整实现（`feat-p3-obsidian-vault`），但未接入 Agent 运行时。
本 Feature 将 `edith_obsidian` 工具注册到 Extension 层、添加默认配置、更新 System Prompt，
使 Agent 在运行时能调用 Obsidian 集成功能（generate / refresh / status）。

## User Value Points

1. **Agent 运行时可调用 Obsidian 工具** — 用户在 EDITH 对话中触发 `edith_obsidian`，
   自动将三层知识产物映射为 Obsidian Vault 结构，支持 Graph View 浏览、Wikilinks 跳转、Frontmatter 元数据。

## Context Analysis

### Reference Code
- `agent/src/tools/obsidian.ts` — 主工具（executeObsidian，3 个 action）
- `agent/src/tools/vault-structure.ts` — Vault 目录结构生成
- `agent/src/tools/edit-detector.ts` — 人工编辑检测（SHA-256）
- `agent/src/tools/wikilinks.ts` — Wikilinks 生成
- `agent/src/tools/frontmatter.ts` — Frontmatter 注入
- `agent/src/extension.ts` — 工具注册入口（当前无 obsidian 注册）
- `agent/src/config.ts` — ObsidianConfig 接口 + 默认值（enabled: false）
- `agent/src/system-prompt.ts` — System Prompt 构建（当前无 Obsidian 描述）
- `agent/edith.yaml` — 运行配置（当前无 obsidian 段）

### Related Documents
- `features/archive/done-feat-p3-obsidian-vault-20260505/` — 原始 Obsidian Feature 归档

### Related Features
- `feat-p3-obsidian-vault`（已完成）— Obsidian 工具代码实现
- `feat-extension-core`（已完成）— Extension 路由层

## Technical Solution

### 1. 注册 `edith_obsidian` 工具到 Extension 层

在 `agent/src/extension.ts` 的 tools 数组中新增 `edith_obsidian` 工具注册，参照现有 `edith_scan` / `edith_distill` 的注册模式：
- name: `edith_obsidian`
- parameters: `{ action: "generate" | "refresh" | "status", services?: string[] }`
- execute: 调用 `executeObsidian()` from `./tools/obsidian.js`

### 2. 在 edith.yaml 添加 Obsidian 配置段

在 `agent/edith.yaml` 末尾添加 `obsidian:` 配置段（默认 enabled: true）：

```yaml
obsidian:
  enabled: true
  vault_path: ./obsidian-vault
  wikilinks: true
  graph_view: true
  frontmatter: true
  human_edit_detection: true
```

### 3. 更新 System Prompt

在 `agent/src/system-prompt.ts` 中注入 Obsidian 工具能力描述，
让 LLM 知道可以使用 `edith_obsidian` 将知识产物导出为 Obsidian Vault。

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，我想让 Agent 自动将知识产物映射为 Obsidian Vault，
以便我在 Obsidian 中用 Graph View 和 Wikilinks 浏览知识网络。

### Scenarios (Given/When/Then)

#### Scenario 1: 生成 Vault（Happy Path）
```gherkin
Given edith.yaml 中 obsidian.enabled 为 true
And workspace 中已有蒸馏后的三层知识产物
When Agent 调用 edith_obsidian({ action: "generate" })
Then 在 vault_path 下生成标准 Obsidian Vault 目录结构
And 包含 .obsidian/ 配置目录（app.json + appearance.json）
And 所有 Markdown 文件包含 YAML Frontmatter 元数据
And 文件间生成 [[wikilink]] 双向链接
```

#### Scenario 2: 刷新 Vault 保留人工编辑
```gherkin
Given Obsidian Vault 已存在
And 用户在 Obsidian 中手动编辑了部分笔记
When Agent 调用 edith_obsidian({ action: "refresh" })
Then 人工编辑的文件被保留（SHA-256 检测）
And 仅自动生成的文件被更新
```

#### Scenario 3: Obsidian 禁用时调用工具
```gherkin
Given edith.yaml 中 obsidian.enabled 为 false 或未配置
When Agent 调用 edith_obsidian({ action: "generate" })
Then 返回错误信息 "Obsidian 集成未启用"
And suggestion 包含 "在 edith.yaml 中设置 obsidian.enabled: true"
```

#### Scenario 4: System Prompt 包含 Obsidian 能力描述
```gherkin
Given edith.yaml 中 obsidian.enabled 为 true
When System Prompt 构建完成
Then Prompt 中包含 edith_obsidian 工具的能力描述和使用说明
```

### General Checklist
- [ ] edith_obsidian 在 extension.ts 正确注册
- [ ] edith.yaml 包含完整 obsidian 配置段
- [ ] System Prompt 包含 Obsidian 工具描述
- [ ] 已有测试通过
- [ ] 无 TypeScript 编译错误
