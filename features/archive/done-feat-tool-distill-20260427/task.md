# Tasks: feat-tool-distill

## Task Breakdown

### 1. Source Document Loading (Scenario 1, 3, 6)
- [x] 定义 `DistillParams` 接口：`{ target: string; token_budget?: Partial<TokenBudget> }`
- [x] 实现 source docs 目录检测：检查 `workspace/{service}/docs/` 是否存在
- [x] 目录不存在 → 返回 `SOURCE_NOT_FOUND` 错误（Scenario 3）
- [x] 实现源文档格式校验：检测文件是否为合法 Markdown
- [x] 格式异常 → 返回 `CORRUPTED_SOURCE` 错误（Scenario 6）
- [x] 编写单元测试：正常加载、目录不存在、文件损坏

### 2. Token Budget Configuration (Scenario 2, 4)
- [x] 定义 `TokenBudget` 接口：`{ routing_table, quick_ref, distillate_per_file }`
- [x] 从 edith.yaml 读取默认 token_budget 配置
- [x] 支持调用时参数覆盖默认配置
- [x] 实现 token 计数工具函数（支持中英文混合文本）
- [x] 编写单元测试：预算读取、参数覆盖、token 计数准确性

### 3. Layer 0 Generation — routing-table.md (Scenario 1, 7)
- [x] 从源文档提取：服务名、角色、技术栈、Owner、关键约束
- [x] 按模板 `templates/en/routing-table.md` 生成 routing-table 条目
- [x] 硬性校验：单条目 <500 token，超出则压缩描述字段
- [x] 实现全局 routing-table.md 合并逻辑（Scenario 7）
- [x] 合并后全局文件 <=500 token，超出则按优先级裁剪
- [x] 编写单元测试：正常生成、超大服务压缩、多服务合并

### 4. Layer 1 Generation — quick-ref.md (Scenario 2, 4)
- [x] 从源文档提取：验证命令、关键约束、易错点、API 端点速查
- [x] 按模板 `templates/en/quick-ref-card.md` 生成
- [x] 实现截断策略（Scenario 4）：
  - 优先保留：验证命令、关键约束、易错点
  - 可裁剪：API 端点列表（保留重要端点，省略 CRUD 重复）
  - 记录 `truncated=true` + 具体裁剪说明到 warnings
- [x] 软性校验：<=quick_ref budget token
- [x] 编写单元测试：正常生成、超预算截断、截断后内容有效性

### 5. Layer 2 Generation — distillates/*.md (Scenario 1, 5)
- [x] 按语义拆分策略：接口契约、数据模型、业务逻辑、配置说明
- [x] 每个片段独立文件，文件名编号：`01-*.md`, `02-*.md`, ...
- [x] 单文件 token 控制：<=distillate_per_file budget
- [x] 部分源文档缺失时，跳过对应片段并记录 warning（Scenario 5）
- [x] 编写单元测试：完整拆分、部分源缺失、单文件超预算

### 6. Result Assembly & Persistence
- [x] 组装 `DistillResult` 结构体（layers, totalTokens, truncated, warnings）
- [x] 将 Layer 0 写入 `workspace/routing-table.md`（全局文件）
- [x] 将 Layer 1 写入 `workspace/{service}/quick-ref.md`
- [x] 将 Layer 2 写入 `workspace/{service}/distillates/*.md`
- [x] 幂等处理：覆盖已有文件，更新 `distilledAt` 时间戳
- [x] 编写单元测试：文件写入、覆盖、目录结构验证

### 7. Error & Warning Framework
- [x] 定义 `DistillError` 类型：error（阻断）vs warning（降级）
- [x] 实现 warning 收集机制：截断、部分失败、合并冲突
- [x] 统一返回格式：`{ ok: boolean; result?: DistillResult; errors?: DistillError[] }`
- [x] 编写集成测试：验证所有 error code 和 warning 场景

### 8. Tool Registration (feat-extension-core integration)
- [x] 在 pi SDK Extension 中注册 edith_distill 工具
- [x] 定义工具 schema：parameters + return type
- [x] 端到端测试：Agent 对话 → edith_distill → 三层产物

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-27 | Spec enriched | Added OUT scope, 4 error/warning scenarios, token budget contract, result structure |
| 2026-04-27 | Implementation complete | Created distill.ts (900+ lines), updated extension.ts with real distill handler, all tasks implemented |
