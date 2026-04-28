# Feature: feat-config-management edith.yaml 配置管理

## Basic Information
- **ID**: feat-config-management
- **Name**: edith.yaml 配置管理
- **Priority**: 90
- **Size**: S
- **Dependencies**: [feat-agent-scaffold]
- **Parent**: feat-agent-mvp
- **Children**: []
- **Created**: 2026-04-27

## Description

实现 edith.yaml 的完整配置管理：解析、验证、类型定义、默认值填充。支持 LLM provider 配置、workspace 路径、repo 列表、token budget 等配置项。提供 `edith-init` 交互式配置向导。

## OUT Scope（本 feature 不做）

- **热加载（hot reload）** — 运行时监听 edith.yaml 文件变更并自动重载不在本 feature 范围内。配置仅在 Agent 启动时读取一次
- **配置加密** — api_key 等敏感字段不做加密存储，仅标记为可选字段
- **多环境配置** — 不支持 edith.dev.yaml / edith.prod.yaml 等环境拆分
- **配置版本迁移** — 不实现旧版本配置文件的自动迁移工具
- **远程配置** — 不支持从 URL 或远程服务加载配置
- **配置 UI** — 不提供 Web 或 GUI 配置界面，仅 CLI 交互向导
- **Agent 运行时配置修改** — Agent 运行中不可修改配置（需重启）

## User Value Points

1. **零代码定制** — 用户通过 edith.yaml 定义 LLM、workspace、repos，无需改代码
2. **配置验证** — 启动时校验配置完整性，错误时给出明确提示
3. **交互式初始化** — edith-init 向导引导新用户生成配置文件，降低上手门槛
4. **合理默认值** — 可选字段有合理默认值，最小配置只需 LLM provider + workspace

## Context Analysis

### Reference Code
- `EDITH-PRODUCT-DESIGN.md` § 2.6 配置模型（完整 YAML 示例）

### Related Documents
- `references/en/company-adaptation.md` — 公司适配指南

### Related Features
- feat-agent-scaffold（前置）
- feat-extension-core（并行）— edith-init 命令 stub 由 Extension 层注册，本 feature 提供实际实现

## Technical Solution

### EdithConfig TypeScript Interface

```typescript
interface EdithConfig {
  llm: { provider: string; model: string; api_key?: string };
  workspace: { root: string; language: "zh" | "en" };
  repos: Array<{ name: string; path: string; stack?: string }>;
  agent: {
    token_budget: { routing_table: number; quick_ref: number; distillate_fragment: number };
    auto_refresh: boolean; refresh_interval: string;
  };
}
```

### 实现方案

- **YAML 解析**: 使用 `js-yaml` 库解析 edith.yaml
- **验证**: 自定义验证函数检查必填字段和类型
- **默认值**: 对可选字段（agent.auto_refresh, agent.refresh_interval, repos[].stack）提供默认值
- **edith-init 向导**: 使用 `@inquirer/prompts` 或类似库实现交互式配置生成

### 配置文件示例

```yaml
llm:
  provider: openai
  model: gpt-4
  api_key: ${OPENAI_API_KEY}  # 支持环境变量引用

workspace:
  root: ./company-edith
  language: zh

repos:
  - name: user-service
    path: /repos/user-service
    stack: java-spring
  - name: order-service
    path: /repos/order-service

agent:
  token_budget:
    routing_table: 500
    quick_ref: 2000
    distillate_fragment: 4000
  auto_refresh: true
  refresh_interval: 24h
```

## Acceptance Criteria (Gherkin)

### Scenario 1: 配置解析成功
```gherkin
Given edith.yaml 存在且格式正确
When Agent 启动
Then 配置被解析为类型安全的 EdithConfig 对象
And 所有字段有合理默认值
```

### Scenario 2: 配置校验 — 缺少必填字段
```gherkin
Given edith.yaml 缺少 llm.provider 字段
When Agent 启动
Then 显示明确错误 "配置校验失败: llm.provider 是必填项"
And Agent 不启动
```

### Scenario 3: edith-init 交互向导
```gherkin
Given 用户执行 edith-init 命令
Then 进入交互式配置向导
And 依次提示 LLM provider、model、workspace 路径、repo 列表
And 最终生成 edith.yaml
```

### Scenario 4: YAML 语法错误（sad-path）
```gherkin
Given edith.yaml 包含无效 YAML 语法（如缩进错误、未闭合引号）
When Agent 尝试加载配置
Then 显示明确错误 "配置文件解析失败: <YAML 错误详情>"
And 包含错误行号信息（如 js-yaml 提供）
And Agent 不启动
```

### Scenario 5: 配置文件不存在（sad-path）
```gherkin
Given 当前目录及上级目录均不存在 edith.yaml
When Agent 启动
Then 显示提示 "未找到 edith.yaml，运行 edith-init 生成配置文件"
And Agent 不启动
```

### Scenario 6: 无效枚举值（sad-path）
```gherkin
Given edith.yaml 中 workspace.language 为 "fr"
When Agent 尝试加载配置
Then 显示错误 "配置校验失败: workspace.language 必须为 'zh' 或 'en'，当前值: 'fr'"
And Agent 不启动
```

### Scenario 7: 部分配置 + 默认值填充
```gherkin
Given edith.yaml 仅包含 llm 和 workspace 段
When Agent 加载配置
Then agent.token_budget 使用默认值 { routing_table: 500, quick_ref: 2000, distillate_fragment: 4000 }
And agent.auto_refresh 默认为 true
And agent.refresh_interval 默认为 "24h"
And repos 默认为空数组
And Agent 正常启动
```

### Scenario 8: 环境变量引用
```gherkin
Given edith.yaml 中 api_key 值为 "${OPENAI_API_KEY}"
And 环境变量 OPENAI_API_KEY 已设置为 "sk-xxx"
When Agent 加载配置
Then api_key 被解析为 "sk-xxx"
```

### Scenario 9: 环境变量未设置（sad-path）
```gherkin
Given edith.yaml 中 api_key 值为 "${OPENAI_API_KEY}"
And 环境变量 OPENAI_API_KEY 未设置
When Agent 加载配置
Then api_key 保持为 undefined（因为 api_key 是可选字段）
And Agent 启动但不带 api_key（由 LLM provider 决定是否报错）
```

### Scenario 10: edith-init 向导中断
```gherkin
Given 用户正在执行 edith-init 交互向导
When 用户在任意步骤按 Ctrl+C 中断
Then 不生成不完整的 edith.yaml 文件
And 显示提示 "配置向导已取消"
```

### Scenario 11: 配置文件路径搜索
```gherkin
Given edith.yaml 存在于上级目录 /project/edith.yaml
And Agent 在 /project/subdir 启动
Then Agent 向上搜索并找到 /project/edith.yaml
And 配置正常加载
```

### General Checklist
- [ ] EdithConfig TypeScript 接口定义完整
- [ ] YAML 解析使用 js-yaml
- [ ] 必填字段验证（llm.provider, llm.model, workspace.root, workspace.language）
- [ ] 枚举值验证（language: "zh" | "en"）
- [ ] 可选字段默认值填充
- [ ] 环境变量引用支持 ${VAR_NAME} 语法
- [ ] 配置文件向上搜索逻辑
- [ ] edith-init 交互向导完整流程
- [ ] 所有错误场景有明确错误消息
