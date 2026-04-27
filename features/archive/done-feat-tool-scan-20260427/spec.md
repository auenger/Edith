# Feature: feat-tool-scan jarvis_scan 工具

## Basic Information
- **ID**: feat-tool-scan
- **Name**: jarvis_scan 工具（对接 document-project Skill）
- **Priority**: 95
- **Size**: M
- **Dependencies**: [feat-extension-core]
- **Parent**: feat-agent-mvp
- **Children**: []
- **Created**: 2026-04-27

## Description

实现 jarvis_scan 工具，对接 document-project Skill。扫描目标项目的代码，逆向生成项目文档，包括技术栈识别、API 端点发现、数据模型提取、业务流程梳理。

## User Value Points

1. **一键代码考古** — 用户说"扫描 user-service"，Agent 自动分析代码并生成结构化文档
2. **多语言技术栈识别** — 自动识别 Java/Go/Python/Node.js 等技术栈并适配分析策略

## Context Analysis

### Reference Code
- `jarvis-skills/document-project/SKILL.md` — document-project Skill 完整定义
- `jarvis-skills/document-project/agents/` — 子 Agent 定义
- `jarvis-skills/document-project/scripts/` — 辅助脚本

### Related Documents
- `JARVIS-PRODUCT-DESIGN.md` § 2.2 生产模式
- `templates/en/repo-inventory.md` — 仓库盘点模板

### Related Features
- feat-extension-core（工具注册）
- feat-tool-distill（后续消费 scan 产出）

## Technical Solution

jarvis_scan 工具 handler 实现：
1. 接收 `{ target, mode? }` 参数
2. 解析 target 为项目路径（从 jarvis.yaml repos 映射）
3. 调用 document-project Skill 执行代码扫描
4. 返回结构化扫描结果（技术栈、端点、模型、流程）
5. 将结果写入 workspace 对应目录

### Parameter Contract

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `target` | string | Yes | - | 服务名（对应 jarvis.yaml repos 中的 key）或绝对路径 |
| `mode` | "full" \| "quick" | No | "full" | 扫描模式：full=完整扫描，quick=仅识别技术栈和端点 |

### Result Structure

```typescript
interface ScanResult {
  service: string;
  path: string;
  techStack: string[];        // ["Spring Boot", "PostgreSQL", "Redis"]
  endpoints: number;
  models: number;
  flows: number;
  outputDir: string;          // "workspace/{service}/docs/"
  files: string[];            // 生成的文件列表
  scannedAt: string;          // ISO timestamp
}
```

## Scope

### IN Scope
- 接收扫描请求并解析参数
- 从 jarvis.yaml repos 映射解析服务名到项目路径
- 调用 document-project Skill 执行代码扫描
- 识别技术栈、API 端点、数据模型、业务流程
- 将结构化扫描结果写入 workspace/{service}/docs/
- 返回扫描摘要给调用方

### OUT Scope
- **不做蒸馏**：不生成 routing-table / quick-ref / distillates（由 feat-tool-distill 负责）
- **不做深度测试分析**：不分析测试文件、测试覆盖率、测试质量
- **不做性能分析**：不做性能剖析、瓶颈检测、资源使用分析
- **不做安全审计**：不做安全漏洞扫描、依赖 CVE 检查
- **不做代码质量评估**：不做 lint、代码复杂度、技术债务评估
- **不做实时监控**：不做文件监听、增量扫描（仅支持一次性全量扫描）

## Acceptance Criteria (Gherkin)

### Happy Path Scenarios

**Scenario 1: 扫描真实项目**
```gherkin
Given jarvis.yaml 中配置了 user-service (path: /repos/user-service)
And user-service 是一个有效的项目目录
When 用户说 "扫描 user-service"
Then jarvis_scan 被触发，target="user-service"
And 自动识别技术栈 (如 Spring Boot + PostgreSQL)
And 返回扫描摘要：端点数、模型数、流程数
And 返回结果包含 ScanResult 结构的所有字段
```

**Scenario 2: 扫描结果持久化**
```gherkin
Given jarvis_scan 完成 user-service 扫描
When 扫描成功
Then 结果写入 workspace/user-service/docs/
And 包含 overview.md、api-endpoints.md、data-models.md
And ScanResult.outputDir 指向正确的目录
```

**Scenario 3: 目标不存在时的错误处理**
```gherkin
Given jarvis.yaml 中未配置 "unknown-service"
When 用户说 "扫描 unknown-service"
Then 返回友好错误 "未找到 unknown-service 的配置，请检查 jarvis.yaml"
And 错误类型为 TARGET_NOT_FOUND
```

### Error / Sad-Path Scenarios

**Scenario 4: 不支持的技术栈**
```gherkin
Given jarvis.yaml 中配置了 legacy-service (path: /repos/legacy-service)
And legacy-service 使用 Cobol 技术栈
When jarvis_scan 扫描 legacy-service
Then 返回错误 "不支持识别的技术栈: Cobol。当前支持: Java/Spring, Go, Python, Node.js"
And 错误类型为 UNSUPPORTED_TECH_STACK
And 仍返回已识别的文件结构信息（降级输出）
```

**Scenario 5: 空项目**
```gherkin
Given jarvis.yaml 中配置了 empty-service (path: /repos/empty-service)
And empty-service 目录存在但没有任何代码文件
When jarvis_scan 扫描 empty-service
Then 返回错误 "目标项目为空，未发现可分析的代码文件"
And 错误类型为 EMPTY_PROJECT
And ScanResult 中 endpoints=0, models=0, flows=0
```

**Scenario 6: 扫描超时**
```gherkin
Given jarvis.yaml 中配置了 huge-service (path: /repos/huge-service)
And huge-service 包含超过 10000 个源文件
When jarvis_scan 扫描 huge-service 且超过 timeout 配置（默认 300s）
Then 返回错误 "扫描超时（300s），项目过大。建议使用 mode=quick 或缩小扫描范围"
And 错误类型为 SCAN_TIMEOUT
```

**Scenario 7: 目录权限不足**
```gherkin
Given jarvis.yaml 中配置了 protected-service (path: /repos/protected-service)
And 当前用户对 /repos/protected-service 没有读取权限
When jarvis_scan 扫描 protected-service
Then 返回错误 "权限不足: 无法读取 /repos/protected-service，请检查目录权限"
And 错误类型为 PERMISSION_DENIED
```

**Scenario 8: 目标路径不存在**
```gherkin
Given jarvis.yaml 中配置了 missing-service (path: /repos/missing-service)
And /repos/missing-service 目录在磁盘上不存在
When jarvis_scan 扫描 missing-service
Then 返回错误 "项目路径不存在: /repos/missing-service，请检查 jarvis.yaml 中的路径配置"
And 错误类型为 PATH_NOT_FOUND
```

### Error Code Summary

| Error Code | Trigger | HTTP Analogy |
|------------|---------|-------------|
| `TARGET_NOT_FOUND` | target 名称不在 jarvis.yaml repos 映射中 | 404 |
| `PATH_NOT_FOUND` | 映射的路径在磁盘上不存在 | 404 |
| `EMPTY_PROJECT` | 目录存在但无代码文件 | 204 |
| `UNSUPPORTED_TECH_STACK` | 无法识别或不支持的技术栈 | 422 |
| `SCAN_TIMEOUT` | 扫描超过配置的超时时间 | 408 |
| `PERMISSION_DENIED` | 无读取目录权限 | 403 |

---

## Merge Record

| Field | Value |
|-------|-------|
| Completed | 2026-04-27T22:15:00+08:00 |
| Merged Branch | feature/feat-tool-scan |
| Merge Commit | fef0237 |
| Archive Tag | feat-tool-scan-20260427 |
| Conflicts | None |
| Verification | PASSED (8/8 Gherkin scenarios, code analysis) |
| Duration | ~15 min |
| Commits | 3 |
| Files Changed | 6 |
