# Feature: feat-packaging Pi Package 打包与分发配置

## Basic Information
- **ID**: feat-packaging
- **Name**: Pi Package 打包与分发配置
- **Priority**: 75
- **Size**: S
- **Dependencies**: [feat-e2e-pilot]
- **Parent**: feat-agent-mvp
- **Children**: []
- **Created**: 2026-04-27

## Description

配置 JARVIS Agent 的打包和分发机制：Pi Package 打包配置、npm/git 分发渠道、安装脚本、版本管理。确保用户可以通过简单命令安装和更新 JARVIS。

## OUT Scope

本功能 **不包含** 以下内容：
- 自动更新机制（不实现后台自动检查新版本）
- 多版本共存（不支持同时安装多个 JARVIS 版本）
- 企业私有 registry 支持（仅支持 npm 公共仓库和 git 分发）
- Board / Artifacts 的打包（仅打包 Agent）
- CI/CD 发布自动化（手动 `pi package` + 手动 publish）
- 混淆或加密打包（Skills 代码不加密）

## User Value Points

1. **一键安装** — 用户通过 `pi install jarvis` 或 `npm install -g @jarvis/agent` 安装
2. **首次引导** — 安装后首次运行自动检测配置，引导初始化
3. **版本可查** — `jarvis --version` 查看当前版本

## Context Analysis

### Reference Code
- `JARVIS-PRODUCT-DESIGN.md` § 6 技术栈 - 分发行

### Research Conclusions

> **pi SDK 打包机制调研结果**（Phase 0 完成）
>
> 1. `pi package` 命令不存在于 pi CLI 中。Pi 使用标准 npm 包作为分发格式。
> 2. `pi-package.yaml` 不存在于 pi SDK 中。这是原始 spec 中的推测性概念。
> 3. `pi install` 接受 npm 包 (`npm:@scope/package`) 或 git 仓库 (`git:github.com/user/repo`)。
> 4. 版本管理使用标准 npm semver，通过 package.json 的 version 字段。
> 5. Pi 没有内置 post-install 钩子。使用 npm 标准的 `scripts.postinstall` 替代。
> 6. Pi Package 和 npm package 完全共存：Pi 包就是 npm 包，通过 `pi install npm:@jarvis/agent` 安装。
>
> **实施策略调整：**
> - 不创建 `pi-package.yaml`（不存在于 pi 生态）
> - 使用标准 npm 打包：package.json + bin 字段 + files 白名单
> - Pi 扩展通过 package.json exports 自动发现（`--extension` 标志也可显式指定）
> - Post-install 通过 npm scripts.postinstall 实现

## Technical Solution

### 文件结构

```text
jarvis-agent/
├── pi-package.yaml          # Pi Package 配置（核心）
├── package.json             # npm 包配置（bin 字段注册 jarvis 命令）
├── bin/
│   └── jarvis.ts            # CLI 入口（解析 --version / --init / 默认启动）
├── src/
│   ├── extension/           # Extension 路由层（编译后包含）
│   ├── skills/              # Skills（编译后包含）
│   │   ├── document-project/
│   │   ├── distillator/
│   │   └── requirement-router/
│   ├── tools/               # Tool 实现（编译后包含）
│   └── prompts/             # System Prompt 模板
│       └── system-prompt.md
├── scripts/
│   └── post-install.ts      # 安装后脚本（检测 jarvis.yaml）
├── templates/               # 配置模板
│   └── jarvis.yaml.template
└── CHANGELOG.md             # 版本变更记录
```

### pi-package.yaml 配置

```yaml
name: jarvis
version: 0.1.0          # 遵循 semver
description: "JARVIS - AI Knowledge Infrastructure Agent"
entry: bin/jarvis.ts     # CLI 入口

extensions:
  - name: jarvis-extension
    entry: src/extension/index.ts

skills:
  - name: document-project
    entry: src/skills/document-project/index.ts
  - name: distillator
    entry: src/skills/distillator/index.ts
  - name: requirement-router
    entry: src/skills/requirement-router/index.ts

templates:
  - templates/jarvis.yaml.template

post-install: scripts/post-install.ts
```

### package.json 关键字段

```json
{
  "name": "@jarvis/agent",
  "version": "0.1.0",
  "bin": {
    "jarvis": "./bin/jarvis.ts"
  },
  "scripts": {
    "postinstall": "ts-node scripts/post-install.ts"
  },
  "files": [
    "bin/",
    "src/",
    "scripts/",
    "templates/",
    "pi-package.yaml",
    "CHANGELOG.md"
  ]
}
```

### 构建流程

```text
1. TypeScript 编译（src/ → dist/）
2. 复制模板和配置文件到 dist/
3. pi package → 生成 .pi-package 文件
4. npm pack 或 npm publish → 生成 npm 包
```

### 安装后脚本逻辑

```text
post-install.ts:
  1. 检测当前目录是否存在 jarvis.yaml
  2. 如果存在 → 输出 "检测到已有配置，直接运行 jarvis 开始使用"
  3. 如果不存在 → 输出 "未检测到配置文件，运行 jarvis --init 开始初始化"
  4. 不自动创建配置，等待用户主动执行 --init
```

### 版本命令逻辑

```text
bin/jarvis.ts:
  - jarvis --version → 读取 package.json version 并输出
  - jarvis --init    → 触发初始化向导（交互式生成 jarvis.yaml）
  - jarvis           → 正常启动 Agent
```

## Acceptance Criteria (Gherkin)

**Scenario 1: Pi Package 打包成功**
```gherkin
Given 项目代码已编译且所有源文件就绪
And pi-package.yaml 配置正确
When 执行 `pi package`
Then 生成有效的 JARVIS Pi Package
And 包含：Extension 入口、3 个 Skills（编译后）、配置模板、System Prompt 模板
And 包含版本号 0.1.0
```

**Scenario 2: 安装成功 — 正常路径**
```gherkin
Given 用户已安装 pi CLI 且 pi 版本兼容
When 执行 `pi install jarvis`
Then JARVIS 安装成功，无报错
And `jarvis` 命令已注册到 PATH
And `jarvis --version` 输出正确的版本号
```

**Scenario 3: 安装失败 — 无 pi CLI**
```gherkin
Given 用户未安装 pi CLI
When 执行 `pi install jarvis`
Then 提示清晰的错误信息："请先安装 pi CLI: npm install -g @mariozechner/pi-coding-agent"
And 不产生部分安装残留
```

**Scenario 4: 首次运行 — 无配置引导初始化**
```gherkin
Given JARVIS 已通过 pi install 安装成功
And 当前目录不存在 jarvis.yaml 配置文件
When 用户执行 `jarvis`
Then 输出 "未检测到配置文件 (jarvis.yaml)"
And 提示 "运行 jarvis --init 开始初始化"
And 不自动创建配置文件
And 不直接启动 Agent
```

**Scenario 5: 首次运行 — 有配置直接启动**
```gherkin
Given JARVIS 已通过 pi install 安装成功
And 当前目录存在有效的 jarvis.yaml 配置文件
When 用户执行 `jarvis`
Then JARVIS Agent 正常启动
And 加载 jarvis.yaml 中的配置（LLM provider、repos 等）
And 显示 JARVIS 品牌化启动界面
```

**Scenario 6: 版本查询**
```gherkin
Given JARVIS 已安装
When 执行 `jarvis --version`
Then 输出语义化版本号（如 "jarvis v0.1.0"）
And 版本号与 pi-package.yaml 和 package.json 中一致
```

**Scenario 7: 从旧版本升级 — 保留配置**
```gherkin
Given 用户已安装 JARVIS v0.1.0 且有 jarvis.yaml 配置文件
When 用户执行 `pi install jarvis` 安装 v0.2.0
Then JARVIS 升级到 v0.2.0
And 原有的 jarvis.yaml 配置文件保持不变
And `jarvis --version` 输出 v0.2.0
And 生成的知识产物（distillates 等）保持不变
```

**Scenario 8: 初始化向导**
```gherkin
Given JARVIS 已安装但当前目录无 jarvis.yaml
When 执行 `jarvis --init`
Then 启动交互式初始化向导
And 依次引导配置：LLM provider、workspace 路径、repos 列表
And 生成有效的 jarvis.yaml 文件
And 后续执行 `jarvis` 可正常启动
```
