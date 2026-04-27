# Tasks: feat-tool-scan

## Task Breakdown

### 1. Parameter Parsing & Validation (Scenario 1, 3, 8)
- [ ] 定义 `ScanParams` 接口：`{ target: string; mode?: "full" | "quick" }`
- [ ] 实现 target 参数解析：优先从 jarvis.yaml repos 映射查找服务名
- [ ] 支持 target 为绝对路径时的直接使用
- [ ] 参数缺失时返回 `MISSING_PARAMETER` 错误
- [ ] 编写单元测试：合法参数解析、缺失参数、无效 mode 值

### 2. Repo Path Resolution (Scenario 1, 3, 8)
- [ ] 读取 jarvis.yaml 中 `repos` 配置段
- [ ] 实现 `resolveTarget(target: string): { name, path }` 函数
- [ ] target 名称匹配失败 → 返回 `TARGET_NOT_FOUND` 错误（Scenario 3）
- [ ] 路径磁盘不存在 → 返回 `PATH_NOT_FOUND` 错误（Scenario 8）
- [ ] 编写单元测试：已知服务名、未知服务名、路径不存在

### 3. Permission & Pre-flight Checks (Scenario 5, 7)
- [ ] 检查目标目录读权限 → 无权限时返回 `PERMISSION_DENIED`（Scenario 7）
- [ ] 检查目录是否为空（无代码文件）→ 返回 `EMPTY_PROJECT`（Scenario 5）
- [ ] 定义"代码文件"判定规则：按扩展名（.java, .go, .py, .ts, .js 等）
- [ ] 编写单元测试：有权限、无权限、空目录、仅含非代码文件

### 4. Skill Invocation & Scanning (Scenario 1, 4, 6)
- [ ] 封装 document-project Skill 的调用接口
- [ ] 将 resolved path + mode 传递给 Skill
- [ ] 实现超时控制：读取 jarvis.yaml 中 `scan_timeout` 配置（默认 300s）→ 超时返回 `SCAN_TIMEOUT`（Scenario 6）
- [ ] 技术栈识别失败时 → 返回 `UNSUPPORTED_TECH_STACK` + 降级输出（Scenario 4）
- [ ] 编写集成测试：mock Skill 调用、超时中断、不支持栈

### 5. Result Persistence (Scenario 2)
- [ ] 定义 `ScanResult` 接口及输出结构
- [ ] 实现 workspace 目录结构创建：`workspace/{service}/docs/`
- [ ] 写入文件：overview.md, api-endpoints.md, data-models.md
- [ ] 幂等处理：已有文件时覆盖并记录 `scannedAt` 时间戳
- [ ] 编写单元测试：目录创建、文件写入、覆盖更新

### 6. Error Handling Framework
- [ ] 定义 `ScanError` 类型：包含 error code + message + suggestion
- [ ] 统一错误返回格式：`{ ok: false, error: ScanError }`
- [ ] 确保所有 6 种错误码都有对应处理路径
- [ ] 编写错误快照测试：验证每种错误的消息模板

### 7. Tool Registration (feat-extension-core integration)
- [ ] 在 pi SDK Extension 中注册 jarvis_scan 工具
- [ ] 定义工具 schema：parameters + return type
- [ ] 配置工具描述（中文，供 Agent 理解用途）
- [ ] 端到端测试：Agent 对话 → 工具调用 → 结果返回

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-27 | Spec enriched | Added OUT scope, 5 error scenarios, error code table, parameter/result contract |
