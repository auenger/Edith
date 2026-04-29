本分片覆盖 [Business Logic]。来自服务: LiteMes。

---
type: edith-distillate
target_service: "LiteMes"
sources:
  - "LiteMes/src/main/java/com/litemes/application/service/"
  - "LiteMes/src/main/java/com/litemes/domain/"
  - "LiteMes/src/main/java/com/litemes/infrastructure/"
created: "2026-04-29T03:00:00.000Z"
---

# LiteMes — Business Logic

## 1. 编码不可变规则 (Code Immutability)

以下实体的业务编码创建后**不可修改**，update 方法中不包含编码字段映射：

| 实体 | 编码字段 | Service |
|------|----------|---------|
| Company | companyCode | CompanyService.update() — 仅更新 name/shortCode |
| Factory | factoryCode | FactoryService.update() — 仅更新 name/shortName/companyId |
| EquipmentLedger | equipmentCode | EquipmentLedgerService.update() — 不更新 equipmentCode |
| MaterialMaster | materialCode | MaterialService.update() — 编码不可变 (推断) |

**实现方式**：Service 层 update 方法中排除编码字段的 setter 调用，不是通过数据库约束。

---

## 2. 级联依赖检查 (Cascade Reference Check)

后端通过 Service 层手动检查父子引用关系：

| 操作 | 检查逻辑 | 错误码 |
|------|----------|--------|
| 删除 Company | 检查是否有 Factory 引用 | `FACTORY_REFERENCED` (TODO) |
| 删除 Factory | `departmentRepository.existsByFactoryId(id)` | `FACTORY_REFERENCED` |
| 禁用 Company | 检查是否有活跃 Factory 引用 | TODO |
| 删除 Department | 级联检查 (TODO) | - |
| 删除 EquipmentType | 检查 EquipmentModel 引用 (TODO) | - |
| 删除 EquipmentModel | 检查 EquipmentLedger 引用 (TODO) | - |

**级联层级**：
- `Company → Factory → Department` (三级)
- `EquipmentType → EquipmentModel → EquipmentLedger` (三级)

---

## 3. 状态切换验证 (Status Toggle)

`PUT /api/{resource}/{id}/status?status={0|1}` 的通用逻辑：

```
1. findOrThrow(id)
2. if (entity.status == requestedStatus) → throw STATUS_UNCHANGED
3. [可选] 禁用时检查活跃子实体引用
4. entity.setStatus(status)
5. repository.update(entity)
```

**已实现状态切换的资源**：Company、Factory、EquipmentLedger、EquipmentType、EquipmentModel、Customer、Supplier、WorkCenter
**无状态切换的资源**：Shift、ShiftSchedule（独立，无启用/禁用概念）、AuditLog（只读）

---

## 4. 逻辑删除 (Logical Delete)

`SoftDeleteEntity` 子类使用 MyBatis-Plus `@TableLogic`：

```java
@TableLogic(value = "0", delval = "1")
private Boolean deleted;
```

- `deleted=0`：活跃记录
- `deleted=1`：已删除记录
- MyBatis-Plus 自动在查询中追加 `WHERE deleted = 0`
- Repository.deleteById() 实际执行 `UPDATE SET deleted=1`
- 物理删除不发生，数据可恢复

---

## 5. 审计日志 (AuditLogService)

`AuditLogService` 提供三个核心方法，由业务 Service 手动调用：

| 方法 | 触发场景 | 记录内容 |
|------|----------|----------|
| `logCreate(tableName, recordId, newValue, operator)` | POST 创建成功后 | 新值 JSON |
| `logUpdate(tableName, recordId, oldValue, newValue, operator)` | PUT 更新成功后 | 旧值 + 新值 JSON + 变更字段列表 |
| `logDelete(tableName, recordId, oldValue, operator)` | DELETE 删除成功后 | 旧值 JSON |

**变更字段计算**：`computeChangedFields()` 将 old/new DTO 转为 Map 后逐字段对比，自动排除 `updatedBy`/`updatedAt`/`deleted` 等审计字段。

**已接入审计日志的 Service**：EquipmentLedgerService（create/update/delete/updateStatus 全部接入）
**待接入**：CompanyService、FactoryService 等其他 Service（目前未调用 AuditLogService）

**审计日志查询**：仅支持 GET 列表查询，支持按 tableName、recordId、startTime、endTime 筛选，不可修改或删除。

---

## 6. 冗余字段自动填充 (Redundant Field Auto-Fill)

`EquipmentLedger` 存储了关联实体的冗余字段以避免多次 JOIN：

| 关联来源 | 冗余字段 |
|----------|----------|
| EquipmentModel | modelCode、modelName、equipmentTypeId、typeCode、typeName |
| Factory | factoryCode、factoryName |

**Create 时**：从 EquipmentModel / Factory 实体中读取后填充到 EquipmentLedger
**Update 时**：如果 equipmentModelId 或 factoryId 变更，自动重新填充所有冗余字段

---

## 7. 业务异常 (BusinessException)

```java
public class BusinessException extends RuntimeException {
    private final String code;  // 错误码，如 "COMPANY_CODE_DUPLICATE"
    // message 为中文用户提示，如 "公司编码已存在"
}
```

**全局异常映射** (GlobalExceptionMapper)：

| 异常类型 | HTTP 状态码 | 响应 |
|----------|------------|------|
| BusinessException | 400 Bad Request | `{ code, message }` |
| AuthenticationFailedException | 401 Unauthorized | `{ code: "UNAUTHORIZED" }` |
| AuthorizationDeniedException | 403 Forbidden | `{ code: "FORBIDDEN" }` |
| 其他 Exception | 500 Internal Server Error | `{ code: "INTERNAL_ERROR" }` |

**已知错误码**：

| 错误码 | 含义 |
|--------|------|
| COMPANY_CODE_DUPLICATE | 公司编码重复 |
| FACTORY_CODE_DUPLICATE | 工厂编码重复 |
| GROUP_NAME_DUPLICATE | 权限组名称重复 |
| EQUIPMENT_CODE_DUPLICATE | 设备编码重复 |
| NOT_FOUND | 实体不存在 |
| STATUS_UNCHANGED | 状态未变更 |
| FACTORY_REFERENCED | 工厂被部门引用，无法删除 |
| COMPANY_NOT_FOUND | 所属公司不存在 |
| EQUIPMENT_MODEL_NOT_FOUND | 设备型号不存在 |
| FACTORY_NOT_FOUND | 工厂不存在 |

---

## 8. 数据权限过滤 (DataScopeInnerInterceptor)

通过 MyBatis-Plus 拦截器实现全局数据隔离：

```
MybatisPlusInterceptor
  ├── PaginationInnerInterceptor     — 分页自动处理
  └── DataScopeInnerInterceptor      — 数据权限范围过滤（基于 CurrentUser.getAccessibleLineIds()）
```

- 权限在基础设施层自动过滤，禁止在业务代码中手动拼接权限条件
- CurrentUser 从 JWT 中解析并通过 CDI Producer 注入

---

## 9. 权限组关联管理 (DataPermissionGroup Association)

权限组支持三级关联实体的动态绑定：

| 关联类型 | 端点模式 | 存储实体 |
|----------|----------|----------|
| Factory | GET factories / POST save | DataPermissionGroupFactory |
| WorkCenter | GET work-centers / POST save | DataPermissionGroupWorkCenter |
| Process | GET processes / POST save | DataPermissionGroupProcess |

**写入策略**：全量替换 (Full Replacement)
1. 删除已有全部关联
2. 批量插入新关联列表
3. 不在业务代码中做 diff 计算

---

## 10. DTO 转换模式

所有 Service 遵循标准模式：

```
Service.create(CreateDto)  → new Entity(...) → repository.save()
Service.update(id, UpdateDto) → findOrThrow → 逐字段 setter → repository.update()
Service.list(QueryDto) → repository.findPage() → stream().map(this::toDto) → PagedResult
Service.getById(id) → findOrThrow → toDto(entity) → return Dto
```

**DTO 四件套**：每个资源配套 `CreateDto` / `UpdateDto` / `QueryDto` / `Dto`

**枚举处理**：RunningStatus 和 ManageStatus 在 DTO 中以 String 类型传输（如 "RUNNING"、"FAULT"），不做枚举序列化映射。

---

## 11. 树形结构处理

- **MaterialCategory**：`parentId` 自引用，使用 `MaterialCategoryTreeDto` 返回树形结构，GET 端点直接返回树而非分页列表
- **Department**：`parentId` 自引用，目前使用标准分页查询，树形结构在前端构建

---

## 12. 硬件通信架构 (未来)

```
PLC / 机台设备
     │ (Modbus TCP / MQTT)
     ▼
Quarkus Scheduled Job (定时轮询)
     │ CDI Domain Events
     ▼
Domain Event Observers (业务处理)
```

架构原则：
- 通信层（Scheduled Job / MQTT）与业务层严格分离
- 通过 CDI Events 解耦
- Redis 分布式锁保护批次过站等并发操作
- Redis Pub/Sub 实现跨节点信号同步
