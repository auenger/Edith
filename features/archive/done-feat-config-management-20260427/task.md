# Tasks: feat-config-management

## Task Breakdown

### 1. Preparation — 依赖调研
- [x] 确认 js-yaml 版本和 API（parse / load / loadAll） — Scenario 1, 4
- [x] 调研交互式 CLI 库选项（@inquirer/prompts / prompts / enquirer） — Scenario 3
- [x] 阅读 `EDITH-PRODUCT-DESIGN.md` § 2.6 配置模型完整 YAML 示例
- [x] 确认 TypeScript 严格模式下 interface 的类型推断行为

### 2. TypeScript Interface 定义（Scenario 1）
- [x] 定义 `EdithConfig` 接口 — 所有字段及类型 — Scenario 1
- [x] 定义 `LlmConfig` 子接口：{ provider: string; model: string; api_key?: string }
- [x] 定义 `WorkspaceConfig` 子接口：{ root: string; language: "zh" | "en" }
- [x] 定义 `RepoConfig` 子接口：{ name: string; path: string; stack?: string }
- [x] 定义 `AgentConfig` 子接口：含 token_budget / auto_refresh / refresh_interval
- [x] 定义 `TokenBudget` 子接口：{ routing_table: number; quick_ref: number; distillate_fragment: number }
- [x] 导出所有接口供 feat-extension-core 等消费

### 3. YAML 解析（Scenario 1, 4, 11）
- [x] 实现 `loadConfig(filePath?: string)` 函数 — Scenario 1
- [x] 文件路径搜索逻辑：当前目录 → 逐级向上搜索 edith.yaml — Scenario 11
- [x] 文件不存在时返回明确错误 + 提示运行 edith-init — Scenario 5
- [x] 使用 js-yaml 解析 YAML，捕获 YAMLException — Scenario 4
- [x] YAML 语法错误时显示错误详情和行号 — Scenario 4

### 4. 环境变量引用（Scenario 8, 9）
- [x] 实现 `resolveEnvVars(value: string)` 函数
- [x] 支持 `${VAR_NAME}` 语法替换为 process.env.VAR_NAME — Scenario 8
- [x] 环境变量不存在时返回 undefined（不报错） — Scenario 9
- [x] 仅对 string 类型字段做环境变量解析

### 5. 配置验证（Scenario 2, 6, 7）
- [x] 实现 `validateConfig(raw: unknown)` 函数 — Scenario 1, 2
- [x] 验证必填字段：llm.provider, llm.model, workspace.root, workspace.language — Scenario 2
- [x] 验证枚举值：workspace.language ∈ {"zh", "en"} — Scenario 6
- [x] 验证 repos 数组元素结构（name + path 必填）
- [x] 验证 agent.token_budget 数值字段为正整数
- [x] 验证错误消息包含字段路径和当前值

### 6. 默认值填充（Scenario 7）
- [x] 定义默认值常量：token_budget { routing_table: 500, quick_ref: 2000, distillate_fragment: 4000 }
- [x] 定义默认值：auto_refresh = true, refresh_interval = "24h"
- [x] 实现 `applyDefaults(config: Partial<EdithConfig>)` 函数 — Scenario 7
- [x] repos 默认为空数组 []
- [x] 仅填充未提供的字段，不覆盖已有值

### 7. edith-init 交互向导（Scenario 3, 10）
- [x] 实现 `initConfigWizard()` 函数 — Scenario 3
- [x] 步骤 1：选择 LLM provider（openai / anthropic / ollama / other） — Scenario 3
- [x] 步骤 2：输入 model 名称（根据 provider 给出建议值） — Scenario 3
- [x] 步骤 3：输入 api_key（可选，支持跳过） — Scenario 3
- [x] 步骤 4：输入 workspace root 路径（默认 ./company-edith） — Scenario 3
- [x] 步骤 5：选择 language（zh / en） — Scenario 3
- [x] 步骤 6：添加 repo 列表（可重复添加，输入空行结束） — Scenario 3
- [x] 步骤 7：确认并生成 edith.yaml — Scenario 3
- [x] Ctrl+C 中断时不生成不完整文件 — Scenario 10
- [x] 已有 edith.yaml 时提示覆盖确认

### 8. 导出公共 API
- [x] 导出 `loadConfig()` — 供 feat-extension-core 的 edith-init 命令调用
- [x] 导出 `validateConfig()` — 供 Agent 启动时调用
- [x] 导出 `initConfigWizard()` — 供 edith-init 命令调用
- [x] 导出 `EdithConfig` 及所有子接口

### 9. Verification — 验收验证
- [x] Scenario 1: 正确 YAML 解析为 EdithConfig 对象
- [x] Scenario 2: 缺少 llm.provider 报错并阻止启动
- [x] Scenario 3: edith-init 完整向导流程生成 edith.yaml
- [x] Scenario 4: 无效 YAML 语法报错含行号
- [x] Scenario 5: 配置文件不存在时提示 edith-init
- [x] Scenario 6: language="fr" 报错
- [x] Scenario 7: 最小配置 + 默认值正常启动
- [x] Scenario 8: ${OPENAI_API_KEY} 正确解析
- [x] Scenario 9: 环境变量未设置时 api_key 为 undefined
- [x] Scenario 10: Ctrl+C 中断不生成文件
- [x] Scenario 11: 上级目录搜索找到 edith.yaml

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-27 | Spec enriched | Added OUT scope, 8 new scenarios (4-11), mapped all tasks to scenarios. Clarified: hot reload NOT in scope |
| 2026-04-27 | Implementation complete | All 9 task groups implemented. TypeScript compiles cleanly. Files: config.ts (full rewrite), index.ts (updated imports), edith.yaml (updated with agent section) |
