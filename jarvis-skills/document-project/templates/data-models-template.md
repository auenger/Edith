# {project_name} — 数据模型

**生成日期：** {date}
**数据库类型：** {database_type}

## Schema 概览

- **表/集合数：** {table_count}
- **ORM：** {orm_name}
- **迁移方式：** {migration_approach}

## 实体关系图

```
{entity_relationship_diagram}
```

## 数据表

### {table_name}

**用途：** {table_purpose}

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| {field_name} | {field_type} | {constraints} | {field_description} |

**索引：**
| 索引名 | 字段 | 类型 | 用途 |
|--------|------|------|------|
| {index_name} | {index_fields} | {index_type} | {index_purpose} |

**关联关系：**
- {relationship_description}

---

## 迁移历史

| 日期 | 迁移文件 | 变更摘要 |
|------|---------|---------|
| {date} | {migration_file} | {change_summary} |

## 数据访问模式

### {model_name}

**主要查询：**
- {query_pattern_description}

**写入模式：**
- {write_pattern_description}

---

_由 jarvis-document-project 生成_
