# Feature: feat-model-hot-switch Config 热更新机制

## Basic Information
- **ID**: feat-model-hot-switch
- **Name**: Config 热更新机制（Model 持久化 + Scan 自动注册 Repo）
- **Priority**: 88
- **Size**: M
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-04-29

## Description

EDITH Agent 的配置文件 `edith.yaml` 当前是"只读消费"模式——运行时只读取，从不写回。这导致两个实际问题：

1. **`/model` 切换不持久化** — 只改内存状态，重启丢失；自定义 Provider（xiaomi）因模型未注册报 "Model not found"
2. **`edith_scan` 扫描新项目不注册** — 扫描完新目录后，知识产物写入了 workspace，但 `repos` 列表不会自动更新，下次还需手动编辑配置

核心需求：**Agent 运行时操作应自动同步回 `edith.yaml`**，包括 model 切换和 repo 发现。

## User Value Points

### VP1: 模型切换持久化 + 自定义模型可用
用户用 `/model xiaomi` 切换后：(1) 立即生效，(2) 下次启动保持，(3) 自定义 Provider 不报 Model not found。

### VP2: 扫描新项目自动注册 Repo
用户让 Agent 扫描一个新目录后，`edith.yaml` 的 `repos` 列表自动追加该条目。下次启动无需手动编辑配置即可通过 repo name 引用。

## Context Analysis

### Root Cause 1：自定义模型注册失败

`useAgentSession.ts` 中的 `registerProvider` 调用没有传 `models` 数组：
```typescript
modelRegistry.registerProvider(profile.provider, {
  api: "openai-completions",
  baseUrl: profile.base_url,
  apiKey: profile.api_key,
  // 缺少 models: [{ id, name, ... }]
});
```

pi SDK 的 `applyProviderConfig()` 逻辑：
- 传了 `models` → 注册新模型
- 没传 `models` → 仅 override 已有模型的 baseUrl（但 xiaomi 不是内置 provider，没有已有模型）

结果：`find("xiaomi", "MiMo-V2.5-Pro")` → null → "Model not found"。

### Root Cause 2：Config 完全只读

整个 Agent 运行时没有任何代码写回 `edith.yaml`。`switchProfile()` 和 `executeScan()` 都只修改内存或写入知识产物，不更新配置源文件。

### Reference Code
- `agent/src/tui/useAgentSession.ts:102-121` — 初始化 registerProvider
- `agent/src/tui/useAgentSession.ts:329-433` — switchProfile()
- `agent/src/tools/scan.ts` — edith_scan 工具（扫描完成不写 config）
- `agent/src/config.ts` — 配置加载（需添加通用写回能力）
- pi SDK `model-registry.js:558-658` — registerProvider 实现

### Related Features
- `feat-openai-compatible-provider`（已完成）— 多 Provider 配置化的原始实现

## Technical Solution

### 修改 1：config.ts 添加通用写回能力

在 `config.ts` 中新增通用的 YAML 局部更新函数：

```typescript
/**
 * 读取 edith.yaml 原始内容，更新指定顶层字段，写回文件。
 * 保留注释和格式（基于行级 patch，非全量重写）。
 */
export function patchConfig(configPath: string, patch: Record<string, unknown>): void

/** 便捷：更新 llm.active */
export function saveActiveProfile(configPath: string, profileName: string): void

/** 便捷：追加 repo 到 repos 列表（去重） */
export function addRepo(configPath: string, repo: RepoConfig): void
```

实现策略：
- 用 `js-yaml` 的 `load` 解析为对象
- 合并 patch
- 用 `dump` 序列化回 YAML（保留注释用 YAMLCommentMap 或接受注释丢失的权衡）
- 写回文件

**关于注释保留的权衡**：`js-yaml.dump()` 会丢失注释。两个方案：
- **A. 简单方案**：接受 dump 后注释丢失，用 `yaml` 库（ CSTPreservingDataProvider）如果需要保留
- **B. 行级 patch**：读取原始文本，正则匹配替换特定字段（如 `active: xxx`），保留其余内容

推荐方案 B（行级 patch），因为 `edith.yaml` 是用户手动维护的配置文件，注释很重要。对于 `llm.active` 和 `repos` 追加这种简单变更，行级 patch 足够。

### 修改 2：自定义模型注册（useAgentSession.ts）

`registerProvider` 调用添加 `models` 数组：

```typescript
// initialize() 和 switchProfile() 中统一使用
modelRegistry.registerProvider(profile.provider, {
  api: (profile.api_type as any) ?? "openai-completions",
  baseUrl: profile.base_url,
  apiKey: profile.api_key,
  models: [{
    id: profile.model,
    name: profile.model,
    reasoning: false,
    input: ["text"],
    contextWindow: profile.context_window ?? 128000,
  }],
});
```

### 修改 3：switchProfile 持久化（useAgentSession.ts）

`switchProfile()` 成功创建新 session 后调用 `saveActiveProfile()`：

```typescript
// switchProfile() 末尾
const configPath = configPathRef.current;
if (configPath) {
  saveActiveProfile(configPath, profileName);
}
return `Switched to ${profile.model} (${profileName})`;
```

需要在 `initialize()` 中记录 configPath 到 ref。

### 修改 4：scan 自动注册 Repo（scan.ts）

`executeScan()` 成功完成扫描后，检查扫描目标是否已在 `repos` 列表中：

```typescript
// scan.ts executeScan() 末尾
const configPath = findConfigFile();
if (configPath && !isRepoKnown(config, targetName, targetPath)) {
  addRepo(configPath, {
    name: targetName,      // 从目录名或用户输入推导
    path: resolvedPath,    // 扫描时已解析的绝对路径
    stack: detectedStack,  // scan 已检测到的 tech stack
  });
}
```

去重逻辑：如果 `repos` 中已存在相同 `name` 或相同 `path`，不重复添加。

### 修改 5：LiteMes 首次补齐（edith.yaml）

在实现上述机制前，先手动把 LiteMes 加入 repos 列表（一次性修复）：
```yaml
repos:
  - name: edith-repo
    path: /Users/ryan/mycode/EDITH-e2e-pilot
  - name: LiteMes
    path: /Users/ryan/mycode/HS_jarvis/agent/company-edith/LiteMes
```

注意：LiteMes 路径在 workspace 内部（`company-edith/LiteMes`），scan 后自动注册时应识别 workspace 内路径，用相对路径或 workspace-relative 路径存储。

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，我希望 Agent 的运行时操作（切换模型、扫描新项目）能自动同步到配置文件，无需手动编辑 `edith.yaml`。

### Scenarios

#### Scenario 1: /model 切换持久化
```gherkin
Given edith.yaml 中 llm.active 为 "deepseek"
When 用户执行 /model xiaomi
Then Agent 显示 "Switched to MiMo-V2.5-Pro (xiaomi)"
And edith.yaml 中 llm.active 更新为 "xiaomi"
```

#### Scenario 2: 重启后保持模型
```gherkin
Given 上一会话通过 /model 切换到 xiaomi
When 重新启动 EDITH Agent
Then Agent 使用 xiaomi profile 初始化
And 不出现 "Model not found" 错误
```

#### Scenario 3: 自定义 Provider 启动成功
```gherkin
Given edith.yaml 中 llm.active 为 xiaomi
And xiaomi profile 有 base_url 和 api_key
When 启动 EDITH Agent
Then Agent 正常初始化，不报 "Model not found: xiaomi/MiMo-V2.5-Pro"
```

#### Scenario 4: 扫描新目录自动注册
```gherkin
Given edith.yaml repos 中没有 "LiteMes"
When Agent 执行 edith_scan 扫描 company-edith/LiteMes 目录
And 扫描成功完成
Then edith.yaml 的 repos 列表自动追加 LiteMes 条目
And 条目包含 name、path、stack（检测到的技术栈）
```

#### Scenario 5: 扫描已注册目录不重复
```gherkin
Given edith.yaml repos 中已有 "LiteMes"
When Agent 再次扫描 LiteMes
Then repos 列表不变（不重复追加）
```

#### Scenario 6: 列出所有 profiles
```gherkin
Given edith.yaml 配置了 deepseek 和 xiaomi 两个 profiles
When 用户执行 /model（无参数）
Then 显示所有 profiles 列表，当前 active 标记 "← active"
```

### General Checklist
- [ ] `config.ts` 添加 `patchConfig` / `saveActiveProfile` / `addRepo` 函数
- [ ] `registerProvider` 传 models 数组
- [ ] `switchProfile()` 成功后写回 llm.active
- [ ] `executeScan()` 成功后自动追加 repos（去重）
- [ ] edith.yaml 注释保留（行级 patch）
- [ ] 错误处理：写入失败不崩溃，log warning
- [ ] 错误处理：无效 profile / 无效 target 给出明确提示

## Merge Record

- **Completed**: 2026-04-29
- **Branch**: feature/model-hot-switch (deleted)
- **Merge commit**: c1a163d
- **Feature commit**: f57fad1
- **Archive tag**: feat-model-hot-switch-20260429
- **Conflicts**: none
- **Verification**: 6/6 Gherkin scenarios passed (code analysis)
- **Files changed**: 4 (+206 lines)
