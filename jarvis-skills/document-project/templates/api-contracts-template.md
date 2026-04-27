# {project_name} — API 契约

**生成日期：** {date}
**项目类型：** {project_type}

## API 概览

- **总端点数：** {total_endpoints}
- **认证方式：** {auth_method}
- **基础路径：** {base_path}
- **协议：** {protocol}

## 端点清单

### {module/group_name}

#### {http_method} {path}

**用途：** {description}
**认证：** {auth_requirement}

**请求：**
```json
{request_schema_or_example}
```

**响应：**
```json
{response_schema_or_example}
```

**错误码：**
| 状态码 | 含义 | 触发条件 |
|--------|------|---------|
| {code} | {meaning} | {condition} |

---

## 认证流程

{auth_flow_description}

## 数据流概览

```
{api_data_flow_diagram}
```

## 注意事项

- {api_notes_and_gotchas}

---

_由 jarvis-document-project 生成_
