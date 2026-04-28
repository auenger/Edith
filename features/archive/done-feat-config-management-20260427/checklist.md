# Checklist: feat-config-management

## TypeScript Interface
- [x] EdithConfig 接口定义完整（llm + workspace + repos + agent）
- [x] 所有子接口独立导出（LLMConfig / WorkspaceConfig / RepoConfig / AgentConfig / TokenBudget）
- [x] language 字段为联合类型 "zh" | "en"
- [x] api_key 和 stack 标记为可选字段

## YAML Parsing
- [x] 使用 js-yaml 解析 edith.yaml
- [x] YAMLException 捕获并显示错误详情 + 行号 — Scenario 4
- [x] 文件不存在时明确提示 "运行 edith-init" — Scenario 5
- [x] 向上搜索配置文件逻辑（当前目录 → 上级目录） — Scenario 11

## Environment Variable Resolution
- [x] ${VAR_NAME} 语法解析为 process.env 值 — Scenario 8
- [x] 环境变量不存在时返回 undefined（不报错） — Scenario 9
- [x] 仅 string 类型字段做环境变量替换

## Validation
- [x] 必填字段验证：llm.provider, llm.model, workspace.root, workspace.language — Scenario 2
- [x] 枚举值验证：workspace.language ∈ {"zh", "en"} — Scenario 6
- [x] repos 数组元素结构验证（name + path 必填）
- [x] agent.token_budget 数值为正整数
- [x] 错误消息包含字段路径和当前无效值
- [x] 验证失败阻止 Agent 启动

## Default Values
- [x] agent.token_budget 默认值：{ routing_table: 500, quick_ref: 2000, distillate_fragment: 4000 } — Scenario 7
- [x] agent.auto_refresh 默认 true — Scenario 7
- [x] agent.refresh_interval 默认 "24h" — Scenario 7
- [x] repos 默认空数组 — Scenario 7
- [x] 不覆盖用户已提供的值

## edith-init Wizard
- [x] LLM provider 选择（openai / anthropic / ollama / other） — Scenario 3
- [x] model 名称输入（根据 provider 建议） — Scenario 3
- [x] api_key 输入（可选，可跳过） — Scenario 3
- [x] workspace root 路径输入（默认 ./company-edith） — Scenario 3
- [x] language 选择（zh / en） — Scenario 3
- [x] repo 列表添加（可重复，空行结束） — Scenario 3
- [x] 确认并生成 edith.yaml — Scenario 3
- [x] Ctrl+C 中断不生成不完整文件 — Scenario 10
- [x] 已有 edith.yaml 时覆盖确认

## Exported API
- [x] loadConfig() 导出供外部调用
- [x] validateConfig() 导出供外部调用
- [x] initConfigWizard() 导出供外部调用
- [x] 所有接口类型导出

## Code Quality
- [x] 无 TODO/FIXME 残留
- [x] 遵循项目命名约定
- [x] 不引入不必要的依赖（仅 js-yaml + CLI prompts 库）
- [x] 无硬编码路径或 magic number

## EDITH Discipline
- [x] 配置优于代码（用户通过 edith.yaml 定制，不改代码）
- [x] 不编造不存在的配置项
- [x] 产出物无 proprietary format

## Documentation
- [x] spec.md Technical Solution section 已填写
- [x] task.md Progress Log 已更新
- [x] 所有 11 个 Gherkin scenario 可验证

---

## Verification Record

| Timestamp | Status | Summary |
|-----------|--------|---------|
| 2026-04-27T21:15:00+08:00 | PASSED | 56/56 tasks complete, TypeScript compiles clean, 11/11 Gherkin scenarios pass |

### Evidence
- `features/active-feat-config-management/evidence/verification-report.md`
