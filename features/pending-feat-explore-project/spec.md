# Feature: feat-explore-project 项目探索命令

## Basic Information

* **ID**: feat-explore-project

* **Name**: 项目探索命令

* **Priority**: 65

* **Size**: M

* **Dependencies**: []

* **Parent**: null

* **Children**: []

* **Created**: 2026-04-28

## Description

新增 `/explore` REPL 命令，让用户在对话中快速探索当前项目的代码结构、技术栈、依赖关系等。无需完整扫描（edith_scan），以轻量级方式获取项目概览。

### 核心诉求

* 用户想在正式扫描前快速了解一个项目/仓库的基本结构

* 类似 Claude Code 的 Explore agent 能力：文件搜索、grep、符号查找

* 输出结构化的项目概览（目录树、技术栈、关键文件）

### 与 edith_scan 的区别

| 维度 | /explore  | edith_scan      |
| -- | --------- | --------------- |
| 目的 | 快速概览      | 深度扫描生成文档        |
| 耗时 | 秒级        | 分钟级             |
| 产出 | 即时终端输出    | 持久化 Markdown 文档 |
| 深度 | 目录结构 + 识别 | 代码考古 + 接口提取     |

## User Value Points

### VP1: 项目结构快速概览

用户指定路径或使用当前 workspace，快速获取目录树、技术栈、关键文件列表。

### VP2: 搜索与发现

支持按文件模式、关键字、符号名称搜索项目文件，类似 grep/find 的能力但输出更友好。

### VP3: 智能摘要

对项目的 README、package.json、配置文件进行快速解析，生成一句话项目描述。

## Context Analysis

### Reference Code

* `agent/src/tools/scan.ts` — 现有扫描逻辑，可复用部分检测模式

* `agent/src/extension.ts` — 命令注册

* `agent/src/config.ts` — workspace 和 repos 配置

### pi SDK API 可用性

* `pi.registerCommand()` — 命令注册

* 命令 handler 中可使用 `ctx` 访问 session 和配置

* 支持 `getArgumentCompletions` 实现路径补全

### Related Features

* `feat-tool-scan`（已完成）— edith_scan 工具，深度扫描

* `feat-extension-core`（已完成）— 命令注册基础设施

## Technical Solution

### 实现方案

#### 1. 命令注册

```typescript
pi.registerCommand("explore", {
  description: "探索项目结构、技术栈和关键文件",
  handler: async (args: string, ctx: ExtensionCommandContext) => {
    const config = loadEdithConfig();
    const targetPath = args || config.workspace.path;
    await exploreProject(targetPath, config);
  }
});
```

#### 2. 核心模块 `agent/src/tools/explore.ts`

功能模块：

* **目录树生成**：递归读取目录，按 .gitignore 过滤，限制深度

* **技术栈检测**：读取 package.json / requirements.txt / go.mod 等，识别框架和语言

* **关键文件识别**：README、配置文件、入口文件

* **搜索能力**：文件名 glob 搜索、内容 grep 搜索

#### 3. 输出格式

```text
╭─ Explore: /path/to/project ───────────────────╮
│                                                │
│  Summary: Next.js 14 + TypeScript + Prisma     │
│  Entry:    src/app/page.tsx                    │
│  Packages: 42 dependencies                     │
│                                                │
│  Structure (depth=2):                          │
│  ├── src/                                      │
│  │   ├── app/         (Next.js App Router)     │
│  │   ├── components/  (React Components)       │
│  │   ├── lib/         (Utilities)              │
│  │   └── prisma/      (Database Schema)        │
│  ├── tests/                                    │
│  ├── public/                                   │
│  └── package.json                              │
│                                                │
│  Key Files:                                    │
│    README.md  next.config.ts  tsconfig.json    │
│                                                │
╰────────────────────────────────────────────────╯
```

### 文件变更

1. `agent/src/tools/explore.ts`（新建）— 核心探索逻辑

2. `agent/src/extension.ts` — 注册 `/explore` 命令

3. `agent/src/theme/explore-panel.ts`（新建）— 输出渲染

## Acceptance Criteria (Gherkin)

### User Story

作为 EDITH 用户，我想执行 `/explore` 快速了解一个项目的结构和能力，以便决定后续操作。

### Scenarios

#### Scenario 1: 探索当前 workspace

```gherkin
Given 用户已配置 edith.yaml 中的 workspace.path
When 用户输入 /explore
Then 系统扫描 workspace 目录
And 显示项目摘要（技术栈、入口文件、依赖数）
And 显示目录树（默认 depth=2）
And 显示关键文件列表
```

#### Scenario 2: 探索指定路径

```gherkin
Given 用户有其他项目的本地路径
When 用户输入 /explore /path/to/other/project
Then 系统扫描指定路径
And 显示该项目的结构和摘要
```

#### Scenario 3: 路径不存在

```gherkin
Given 用户输入了一个不存在的路径
When 用户输入 /explore /nonexistent/path
Then 系统显示友好的错误提示 "Path not found: /nonexistent/path"
And 不崩溃
```

#### Scenario 4: 搜索文件与内容

```gherkin
Given 用户已在 /explore 中浏览了项目结构
When 用户输入 /explore --grep "EdithConfig"
Then 系统在项目中搜索包含 "EdithConfig" 的文件
And 显示匹配的文件路径和行号
And 搜索结果按相关度排序
```

### General Checklist

* [ ] 尊重 .gitignore 规则，跳过 node_modules/.git 等目录
* [ ] 目录树深度有默认限制（避免大型项目输出过长）
* [ ] 识别常见技术栈标识文件
* [ ] 使用 EDITH 主题色彩渲染

⠀