# {target_name} — 模块深入文档

**生成日期：** {date}
**扫描范围：** {target_path}
**文件数量：** {file_count}
**代码行数：** {total_loc}

## 概览

{target_description}

**用途：** {target_purpose}
**核心职责：** {responsibilities}
**集成点：** {integration_summary}

## 文件清单

### {file_path}

**用途：** {purpose}
**代码行数：** {loc}
**文件类型：** {file_type}

**贡献者须知：** {contributor_note}

**导出：**
- `{signature}` — {description}

**依赖：**
- `{import_path}` — {reason}

**被依赖：**
- `{dependent_path}`

**关键实现：**
```{language}
{key_code_snippet}
```

**模式：** {patterns}
**副作用：** {side_effects}
**错误处理：** {error_handling}
**测试：** {test_file_path}（覆盖 {coverage_percentage}%）

---

## 风险提示

- **风险和坑点：** {risks_notes}
- **修改前验证步骤：** {verification_steps}
- **建议的测试：** {suggested_tests}

## 依赖关系图

```
{dependency_graph_visualization}
```

### 入口节点（不被其他文件导入）

{entry_point_files}

### 叶子节点（不导入其他文件）

{leaf_files}

### 循环依赖

{circular_dependency_status}

## 数据流

{data_flow_description}

### 数据入口

- **{entry_name}**：{entry_description}

### 数据转换

- **{transformation_name}**：{transformation_description}

### 数据出口

- **{exit_name}**：{exit_description}

## 集成点

### 消费的 API

- **{api_endpoint}**：{api_description}（方法：{method}，认证：{auth}）

### 暴露的 API

- **{api_endpoint}**：{api_description}（请求：{request_schema}，响应：{response_schema}）

### 数据库访问

- **{table_name}**：{operation_type}（查询模式：{query_patterns}）

## 修改指南

### 添加新功能

{modification_guidance_add}

### 修改现有功能

{modification_guidance_modify}

### 删除/废弃

{modification_guidance_remove}

---

_由 jarvis-document-project（deep-dive 模式）生成_
