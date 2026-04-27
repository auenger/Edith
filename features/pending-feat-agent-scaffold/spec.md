# Feature: feat-agent-scaffold Agent 项目骨架 + pi SDK 环境搭建

## Basic Information
- **ID**: feat-agent-scaffold
- **Name**: Agent 项目骨架 + pi SDK 环境搭建
- **Priority**: 100
- **Size**: M
- **Dependencies**: none
- **Parent**: feat-agent-mvp
- **Children**: []
- **Created**: 2026-04-27

## Description

搭建 JARVIS Agent 的项目骨架：初始化 TypeScript 项目、集成 pi SDK (`@mariozechner/pi-coding-agent`)、建立 Extension 骨架结构、配置 jarvis.yaml 解析入口。

这是 Phase 1 的基础设施 feature，所有后续 Agent feature 都依赖此骨架。

### Scope

**IN:**
- TypeScript 项目初始化（package.json / tsconfig.json）
- pi SDK 作为依赖引入并验证可用
- Extension 骨架（空工具注册，可被 pi SDK 加载）
- jarvis.yaml 最小解析（读取配置并打印）
- `npm start` 可启动 Agent 并显示欢迎信息

**OUT:**
- 不实现任何 jarvis_* 工具的业务逻辑（feat-extension-core 负责）
- 不实现 TUI 品牌化（feat-tui-branding 负责）
- 不实现配置验证 / 热加载（feat-config-management 负责）
- 不实现 jarvis-init 交互向导（feat-config-management 负责）
- 不 fork pi SDK，仅作为 npm 依赖引入

## User Value Points

1. **可运行的 Agent 空壳** — 用户可以在终端启动 JARVIS Agent（即使还没有实际功能），看到欢迎信息和交互式提示符
2. **pi SDK 集成验证** — Agent Loop、TUI 基础设施就绪，后续 feature 只需注册工具即可扩展功能

## Context Analysis

### Reference Code
- `jarvis-skills/` — 三个现有 Skill 的目录结构作为项目组织参考
- `jarvis-skills/document-project/SKILL.md` — Skill 定义规范
- `jarvis-skills/distillator/scripts/analyze_sources.py` — 唯一 Python 脚本参考
- `SKILL.md` — 黄金路径定义

### Related Documents
- `JARVIS-PRODUCT-DESIGN.md` § 2.1 架构图、§ 2.3 Extension 核心设计（伪代码）
- `JARVIS-PRODUCT-DESIGN.md` § 2.6 配置模型（jarvis.yaml 完整示例）
- `references/en/instance-generation-contract.md` — 实例生成契约

### Related Features
- feat-extension-core（依赖本 feature — 在骨架上注册工具）
- feat-config-management（依赖本 feature — 增强配置管理）
- feat-tui-branding（依赖本 feature — 定制品牌界面）

## Technical Solution

```text
agent/
├── package.json              ← TypeScript + pi SDK 依赖
│                               scripts: { start: "ts-node src/index.ts" }
│                               dependencies: { @mariozechner/pi-coding-agent }
├── tsconfig.json             ← strict: true, target: ES2022, module: NodeNext
├── jarvis.yaml               ← 示例配置（最小可运行版本）
├── src/
│   ├── index.ts              ← 入口：启动 pi Agent + 加载 Extension
│   │                           import { createAgent } from "@mariozechner/pi-coding-agent"
│   │                           createAgent({ extensions: [jarvisExtension] })
│   ├── extension.ts          ← Extension 骨架（空工具注册，导出默认函数）
│   │                           export default function(pi: ExtensionAPI) { ... }
│   └── config.ts             ← jarvis.yaml 解析（YAML → TypeScript 接口）
│                               使用 yaml 或 js-yaml 库解析
└── README.md                 ← 安装和运行说明
```

jarvis.yaml 示例配置：
```yaml
llm:
  provider: anthropic
  model: claude-sonnet-4-6
workspace:
  root: ./company-jarvis
  language: zh
repos: []
```

## Acceptance Criteria (Gherkin)

### User Story
作为 JARVIS 开发者，我需要一个可运行的 Agent 项目骨架，以便在此基础上逐步添加 jarvis_scan / jarvis_distill 等工具。

### Scenarios

**Scenario 1: Agent 启动并显示欢迎信息**
```gherkin
Given 项目已安装依赖 (npm install)
When 执行 `npm start`
Then Agent 启动成功，退出码为 0
And 终端显示 "JARVIS" 或 "jarvis" 相关欢迎文字
And 进入交互式命令行等待输入
```

**Scenario 2: jarvis.yaml 配置加载**
```gherkin
Given jarvis.yaml 文件存在且包含 llm.provider: "anthropic" 和 workspace.root: "./company-jarvis"
When Agent 启动
Then 配置被解析为 TypeScript 对象
And workspace.root 值为 "./company-jarvis"
And repos 为空数组
```

**Scenario 3: pi SDK 集成验证**
```gherkin
Given pi SDK 已作为 npm 依赖安装
When Agent 启动
Then pi SDK 的 createAgent 函数被调用
And Extension 骨架被加载（无工具注册错误）
And Agent Loop 进入等待状态
```

**Scenario 4: jarvis.yaml 不存在时的处理**
```gherkin
Given 当前目录下不存在 jarvis.yaml 文件
When 执行 `npm start`
Then 显示友好错误 "未找到 jarvis.yaml 配置文件，请先创建配置"
And Agent 不崩溃（退出码非 0 但无 uncaught exception）
```

**Scenario 5: jarvis.yaml 格式错误时的处理**
```gherkin
Given jarvis.yaml 存在但包含无效 YAML 语法（如缩进错误）
When 执行 `npm start`
Then 显示明确的 YAML 解析错误信息（包含行号和错误描述）
And Agent 不崩溃（退出码非 0 但无 uncaught exception）
```

**Scenario 6: npm install 安装依赖**
```gherkin
Given 项目目录下有 package.json 且 pi SDK 已列为依赖
When 执行 `npm install`
Then 所有依赖安装成功，退出码为 0
And node_modules/@mariozechner/pi-coding-agent 目录存在
```

### General Checklist
- [ ] TypeScript 项目初始化，strict 模式
- [ ] pi SDK 作为依赖引入，不 fork
- [ ] Extension 骨架可被 pi SDK 加载
- [ ] jarvis.yaml 解析器工作正常
- [ ] `npm start` 可启动 Agent
