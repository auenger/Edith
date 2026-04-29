# Feature: feat-multi-api-protocol Multi-API Protocol Provider Support

## Basic Information
- **ID**: feat-multi-api-protocol
- **Name**: Multi-API Protocol Provider Support
- **Priority**: 82
- **Size**: M
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-04-29

## Description

让 EDITH Agent 支持通过多种 API 协议（OpenAI Compatible + Anthropic Compatible）接入任意 LLM Provider。

当前 `edith.yaml` 的 profile 配置中 `api_type` 硬编码为 `"openai-completions"`，导致使用 Anthropic 协议的 Provider（如 MiniMax、智谱 GLM）无法正确接入。本 Feature 解除这一限制，并添加常用 Provider 预设模板和 Tool Calling 兼容性保障。

## User Value Points

### VP1: api_type 显式配置
用户可在 edith.yaml 中为每个 profile 显式指定 `api_type: anthropic` 或 `api_type: openai-completions`，从而接入不同协议的 Provider。

### VP2: Tool Calling 兼容
确保通过 Anthropic 协议接入的 Provider 正确支持 EDITH 的 Tool Calling（edith_scan、edith_distill、edith_query、edith_explore 等）。

### VP3: Provider 预设模板
提供常用 Provider（MiniMax、智谱 GLM、DeepSeek、Xiaomi MiMo）的预设配置模板，用户可快速添加新 Provider。

## Context Analysis

### Reference Code
- `agent/src/config.ts` — Profile 类型定义 (`LlmProfile.api_type`)，默认值逻辑
- `agent/src/tui/useAgentSession.ts` — Provider 注册逻辑 (`registerProvider()` 调用)
- `agent/src/context-monitor.ts` — Model → Context Window 映射表
- `agent/edith.yaml` — 当前配置示例

### Related Documents
- `CLAUDE.md` — "配置优于代码" 原则
- `project-context.md` — Agent 架构分层

### Related Features
- `feat-openai-compatible-provider`（已完成）— 多 LLM Provider 配置化基础
- `feat-model-hot-switch`（已完成）— Model 热切换

## Technical Solution

### 1. config.ts 修改

**LlmProfile.api_type 默认值改进：**
- 当前：`api_type` 在 `applyDefaults()` 中默认为 `"openai-completions"`（仅当 base_url 存在时）
- 改为：允许用户显式设置 `"anthropic"` | `"openai-completions"` | `"openai-responses"` 等

**验证逻辑增强：**
- `validateConfig()` 检查 `api_type` 是否为 pi SDK 支持的值

### 2. useAgentSession.ts 修改

**Provider 注册时传入正确的 api_type：**
```typescript
modelRegistry.registerProvider(profile.provider, {
  api: profile.api_type ?? "openai-completions",  // 使用用户指定的 api_type
  baseUrl: profile.base_url,
  apiKey: profile.api_key,
  models: [{ ... }],
});
```

### 3. context-monitor.ts 修改

**新增 Model Context Window 映射：**
```typescript
"minimax-m2.7": 1_000_000,
"glm-5.1": 128_000,
"glm-4-plus": 128_000,
```

### 4. Provider 预设模板（edith.yaml 注释）

```yaml
profiles:
  minimax:
    provider: minimax
    model: MiniMax-M2.7
    api_key: ${MINIMAX_API_KEY}
    base_url: https://api.minimaxi.com/anthropic
    api_type: anthropic           # 显式指定 Anthropic 协议
    context_window: 1000000

  zhipu:
    provider: zhipu
    model: GLM-5.1
    api_key: ${ZHIPU_API_KEY}
    base_url: https://open.bigmodel.cn/api/anthropic
    api_type: anthropic
    context_window: 128000
```

### 5. PROVIDER_MODEL_HINTS 更新

```typescript
minimax: ["MiniMax-M2.7", "MiniMax-M1"],
zhipu: ["GLM-5.1", "GLM-4-Plus", "GLM-4"],
```

### 6. Tool Calling 兼容性验证

- Anthropic 协议的 Tool Calling 格式与 OpenAI 不同
- pi SDK 内部处理协议差异（通过 `api` 参数选择正确的请求格式）
- 需确认 pi SDK v0.70+ 对 Anthropic 协议 Tool Calling 的支持情况
- 如有 gap，需在 Extension 层做适配

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，我希望在 edith.yaml 中配置使用 Anthropic 协议的 LLM Provider（如 MiniMax、智谱），并通过 `/model` 命令切换使用，同时所有 EDITH 工具（scan/distill/query/explore/route）正常工作。

### Scenarios

#### Scenario 1: 配置 Anthropic 协议 Provider
```gherkin
Given edith.yaml 中配置了 api_type: anthropic 的 profile
When EDITH Agent 启动
Then 该 Provider 通过 Anthropic 协议正确注册到 pi SDK
And TUI 状态栏显示正确的 model 信息
```

#### Scenario 2: Tool Calling 通过 Anthropic 协议工作
```gherkin
Given 当前使用 api_type: anthropic 的 Provider
When 用户发送需要 Tool Calling 的请求（如 "扫描这个项目"）
Then edith_scan 工具被正确调用并返回结果
And ToolCallBlock 正确渲染工具调用过程
```

#### Scenario 3: 多协议 Provider 切换
```gherkin
Given edith.yaml 中同时配置了 openai-completions 和 anthropic 的 profile
When 用户执行 /model minimax 切换到 Anthropic 协议的 Provider
Then Agent Session 正确重建，使用 Anthropic 协议
And 后续请求通过 Anthropic 协议发送
```

#### Scenario 4: Provider 预设模板开箱即用
```gherkin
Given 用户复制预设模板到 edith.yaml 并填入 API Key
When EDITH Agent 启动
Then Provider 正确加载，无需额外配置
```

### General Checklist
- [ ] api_type 字段在 edith.yaml 中可显式配置
- [ ] 默认值行为不变（无 api_type 时默认 openai-completions）
- [ ] Anthropic 协议 Provider 的 Tool Calling 正常工作
- [ ] context-monitor 正确识别新 Provider 的模型上下文窗口
- [ ] /model 命令可在不同协议的 Provider 之间切换
- [ ] 预设模板注释完整可用
- [ ] 向后兼容：现有 edith.yaml 无需修改

## Merge Record

- **Completed**: 2026-04-29T22:55:00+08:00
- **Merged Branch**: feature/multi-api-protocol
- **Merge Commit**: 4882a0e
- **Archive Tag**: feat-multi-api-protocol-20260429
- **Conflicts**: none
- **Verification**: passed (TypeScript compilation, api_type validation, backward compat)
- **Stats**: 1 commit, 4 files changed, 51 insertions, 4 deletions
- **Duration**: ~5 min
