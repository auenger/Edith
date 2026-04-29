# Feature: feat-openai-compatible-provider

## Basic Information
- **ID**: feat-openai-compatible-provider
- **Name**: 多 LLM Provider 配置化支持 + TUI 切换
- **Priority**: 70
- **Size**: M
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-04-29

## Description

支持在 edith.yaml 中配置多个 LLM Provider（命名 profiles），运行时通过 TUI 命令或配置文件切换。
同时支持任意 OpenAI 协议兼容端点（Xiaomi MiMo、Moonshot、本地 Ollama 等）的动态注册。
TUI 状态栏显示当前活跃的 model 名称，让用户随时知道在跟哪个模型对话。

### 配置示例

```yaml
llm:
  active: xiaomi                    # 当前使用的 profile
  profiles:
    deepseek:
      provider: deepseek
      model: deepseek-v4-pro
      # api_key 走环境变量 ${DEEPSEEK_API_KEY}
    xiaomi:
      provider: xiaomi
      model: MiMo-V2.5-Pro
      api_key: tp-cjv0fx4pwjg961xse8gvglmavi4f2phasnu7yae8bxq4p5cn
      base_url: https://token-plan-cn.xiaomimimo.com/v1
    local-ollama:
      provider: ollama
      model: qwen3:32b
      base_url: http://localhost:11434/v1
```

### 向后兼容

旧格式（单 provider）依然有效，启动时自动转换为 `profiles.default`：

```yaml
llm:
  provider: deepseek
  model: deepseek-v4-pro
```

## User Value Points

1. **多 Provider 配置** — 一个 yaml 管理所有模型端点，无需记住不同 key 和 url
2. **运行时切换** — `/model xiaomi` 即时切换，无需重启 Agent
3. **TUI 状态栏展示** — 底部状态栏显示当前 model，用户随时知道在用哪个模型

## Context Analysis

### Reference Code
- `agent/src/config.ts` — LlmConfig 接口，已有 `base_url` 和 `api_key` 字段
- `agent/src/tui/useAgentSession.ts:86-109` — ModelRegistry 创建 + session 创建流程
- `agent/src/tui/App.tsx` — 主 TUI 布局（Banner / Content / ContextStatusBar / Input）
- `agent/src/tui/StatusBarMetrics.tsx` — 状态栏指标组件
- pi SDK `ModelRegistry.registerProvider()` — 动态注册自定义 provider
- pi SDK `ProviderConfigInput` — provider 注册接口

### Related Documents
- `CLAUDE.md` — "配置优于代码"原则
- pi SDK `KnownApi`: `"openai-completions"` 适用于 OpenAI 兼容端点

### Related Features
- feat-config-management（已完成）— edith.yaml 配置体系
- feat-tui-slash-commands（已完成）— 斜杠命令系统

## Technical Solution

### 改动点（5 个文件）

#### 1. `agent/src/config.ts` — 配置模型升级

**LlmConfig 接口扩展：**

```typescript
export interface LlmProfile {
  provider: string;
  model: string;
  api_key?: string;
  base_url?: string;
  api_type?: string;       // 默认 "openai-completions"
  context_window?: number;
}

export interface LlmConfig {
  // 新格式：profiles 模式
  active?: string;                    // 当前活跃 profile 名
  profiles?: Record<string, LlmProfile>;

  // 旧格式（向后兼容，启动时转为 profiles）
  provider?: string;
  model?: string;
  api_key?: string;
  base_url?: string;
  context_window?: number;
}
```

**loadConfig() 逻辑：**
- 检测到 `profiles` 字段 → 新格式，取 `active` 指定的 profile
- 无 `profiles` → 旧格式，自动包装为 `profiles.default`
- `getActiveProfile(): LlmProfile` 辅助方法
- `listProfiles(): string[]` 辅助方法

**PROVIDER_MODEL_HINTS 新增：**
```typescript
xiaomi: ["MiMo-V2.5-Pro", "MiMo-V2.5"],
moonshot: ["moonshot-v1-128k", "moonshot-v1-32k"],
```

#### 2. `agent/src/tui/useAgentSession.ts` — Provider 注册 + 切换

**初始化阶段：**
```typescript
// 遍历所有 profiles，为有 base_url 的注册自定义 provider
for (const [name, profile] of Object.entries(config.llm.profiles)) {
  if (profile.base_url && profile.api_key) {
    modelRegistry.registerProvider(profile.provider, { ... });
  }
}

// 用 active profile 的 provider/model 创建 session
const active = getActiveProfile(config);
const model = modelRegistry.find(active.provider, active.model);
```

**切换方法（暴露给 App）：**
```typescript
switchProfile(profileName: string): Promise<void>
  // 1. 验证 profile 存在
  // 2. 更新 config.active
  // 3. 销毁旧 session，用新 profile 创建新 session
  // 4. 通知 TUI 刷新
```

#### 3. `agent/src/tui/App.tsx` — TUI 显示当前 model

**ContextStatusBar 组件扩展：**

在现有状态栏左侧增加 model 指标：

```
[Model: MiMo-V2.5-Pro] │ CTX: 45.2% (58k/128k) │ Cache: 72%
```

- 从 `config.llm.active` + `profiles[active]` 获取当前 model
- 颜色：内置 provider 用白色，自定义 provider 用青色

#### 4. `agent/src/extension.ts` — 新增 /model 命令

**`/model` 命令行为：**

```
/model                    → 显示所有 profiles + 当前 active
/model xiaomi             → 切换到 xiaomi profile（重建 session）
/model deepseek           → 切换到 deepseek profile
```

切换时：
1. 发送 "[System] Switching model to MiMo-V2.5-Pro..." 提示
2. 调用 switchProfile()
3. 发送新 system prompt
4. 显示切换成功确认

#### 5. `agent/edith.yaml` — 配置示例更新

更新默认配置为 profiles 模式（保留旧格式注释）。

## Acceptance Criteria (Gherkin)

### Scenario 1: Profiles 模式正常启动

```gherkin
Given edith.yaml 配置了 profiles (deepseek, xiaomi, local-ollama)
  And active 为 "xiaomi"
When Agent 启动
Then xiaomi profile 的 registerProvider() 被调用
  And session 使用 xiaomi/MiMo-V2.5-Pro 创建成功
  And TUI 状态栏显示 "Model: MiMo-V2.5-Pro"
```

### Scenario 2: 旧格式向后兼容

```gherkin
Given edith.yaml 使用旧格式 (provider: deepseek, model: deepseek-v4-pro)
  And 无 profiles 字段
When Agent 启动
Then 自动包装为 profiles.default
  And 走内置 provider 逻辑，session 创建成功
```

### Scenario 3: /model 命令列出所有 profiles

```gherkin
Given 配置了 3 个 profiles
When 用户输入 /model
Then 显示所有 profile 名称、model、是否为当前 active
```

### Scenario 4: /model 命令切换 profile

```gherkin
Given 当前 active 为 "deepseek"
When 用户输入 /model xiaomi
Then session 重建为 xiaomi profile
  And 状态栏更新为 "Model: MiMo-V2.5-Pro"
  And 用户可继续对话
```

### Scenario 5: /model 切换到不存在的 profile

```gherkin
Given 配置了 deepseek 和 xiaomi profiles
When 用户输入 /model gpt4
Then 显示错误 "Profile 'gpt4' not found. Available: deepseek, xiaomi"
  And 当前 session 不受影响
```

### Scenario 6: base_url 缺少 api_key

```gherkin
Given profile 有 base_url 但无 api_key
When Agent 启动
Then 跳过该 profile 的 registerProvider()
  And 日志警告 "Profile 'xxx': skipped (base_url requires api_key)"
  And 其他 profiles 正常加载
```
