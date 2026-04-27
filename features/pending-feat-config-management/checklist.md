# Checklist: feat-config-management

## TypeScript Interface
- [ ] JarvisConfig 接口定义完整（llm + workspace + repos + agent）
- [ ] 所有子接口独立导出（LLMConfig / WorkspaceConfig / RepoConfig / AgentConfig / TokenBudget）
- [ ] language 字段为联合类型 "zh" | "en"
- [ ] api_key 和 stack 标记为可选字段

## YAML Parsing
- [ ] 使用 js-yaml 解析 jarvis.yaml
- [ ] YAMLException 捕获并显示错误详情 + 行号 — Scenario 4
- [ ] 文件不存在时明确提示 "运行 jarvis-init" — Scenario 5
- [ ] 向上搜索配置文件逻辑（当前目录 → 上级目录） — Scenario 11

## Environment Variable Resolution
- [ ] ${VAR_NAME} 语法解析为 process.env 值 — Scenario 8
- [ ] 环境变量不存在时返回 undefined（不报错） — Scenario 9
- [ ] 仅 string 类型字段做环境变量替换

## Validation
- [ ] 必填字段验证：llm.provider, llm.model, workspace.root, workspace.language — Scenario 2
- [ ] 枚举值验证：workspace.language ∈ {"zh", "en"} — Scenario 6
- [ ] repos 数组元素结构验证（name + path 必填）
- [ ] agent.token_budget 数值为正整数
- [ ] 错误消息包含字段路径和当前无效值
- [ ] 验证失败阻止 Agent 启动

## Default Values
- [ ] agent.token_budget 默认值：{ routing_table: 500, quick_ref: 2000, distillate_fragment: 4000 } — Scenario 7
- [ ] agent.auto_refresh 默认 true — Scenario 7
- [ ] agent.refresh_interval 默认 "24h" — Scenario 7
- [ ] repos 默认空数组 — Scenario 7
- [ ] 不覆盖用户已提供的值

## jarvis-init Wizard
- [ ] LLM provider 选择（openai / anthropic / ollama / other） — Scenario 3
- [ ] model 名称输入（根据 provider 建议） — Scenario 3
- [ ] api_key 输入（可选，可跳过） — Scenario 3
- [ ] workspace root 路径输入（默认 ./company-jarvis） — Scenario 3
- [ ] language 选择（zh / en） — Scenario 3
- [ ] repo 列表添加（可重复，空行结束） — Scenario 3
- [ ] 确认并生成 jarvis.yaml — Scenario 3
- [ ] Ctrl+C 中断不生成不完整文件 — Scenario 10
- [ ] 已有 jarvis.yaml 时覆盖确认

## Exported API
- [ ] loadConfig() 导出供外部调用
- [ ] validateConfig() 导出供外部调用
- [ ] initConfigWizard() 导出供外部调用
- [ ] 所有接口类型导出

## Code Quality
- [ ] 无 TODO/FIXME 残留
- [ ] 遵循项目命名约定
- [ ] 不引入不必要的依赖（仅 js-yaml + CLI prompts 库）
- [ ] 无硬编码路径或 magic number

## JARVIS Discipline
- [ ] 配置优于代码（用户通过 jarvis.yaml 定制，不改代码）
- [ ] 不编造不存在的配置项
- [ ] 产出物无 proprietary format

## Documentation
- [ ] spec.md Technical Solution section 已填写
- [ ] task.md Progress Log 已更新
- [ ] 所有 11 个 Gherkin scenario 可验证
