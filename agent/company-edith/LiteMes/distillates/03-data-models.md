本分片覆盖 [Data Models]。来自服务: LiteMes。

---
type: edith-distillate
target_service: "LiteMes"
sources:
  - "LiteMes/docs/data-models.md"
created: "2026-04-28T01:25:43.759Z"
---

# LiteMes — Data Models

# LiteMes - Data Models



## Entity Hierarchy


```
BaseEntity (abstract)
├── id: Long (auto-increment, @TableId)
├── createdBy: String (@TableField INSERT)
├── createdAt: LocalDateTime (@TableField INSERT)
├── updatedBy: String (@TableField INSERT_UPDATE)
└── updatedAt: LocalDateTime (@TableField INSERT_UPDATE)

SoftDeleteEntity extends BaseEntity (abstract)
└── deleted: Boolean (@TableLogic: 1=deleted, 0=active)
```


## Domain Entities (34 entities)


### Organization (组织架构)


| Entity | Extends | Key Fields | Notes |
|--------|---------|------------|-------|
| Company | SoftDeleteEntity | companyCode, name, shortCode, status | companyCode unique and immutable |
| Factory | SoftDeleteEntity | factoryCode, name, companyId, status | Linked to Company |
| Department | SoftDeleteEntity | departmentCode, name, factoryId, status | Linked to Factory |
| DepartmentUser | BaseEntity | departmentId, userId | Many-to-many mapping |
| User | SoftDeleteEntity | username, password, realName, roles | JWT auth |
| Shift | BaseEntity | name, startTime, endTime | Shift definition |
| ShiftSchedule | SoftDeleteEntity | name, factoryId, shifts (JSON) | Schedule linked to Factory |

### Equipment (设备管理)


| Entity | Extends | Key Fields | Notes |
|--------|---------|------------|-------|
| EquipmentType | SoftDeleteEntity | typeCode, name, status | Equipment classification |
| EquipmentModel | SoftDeleteEntity | modelCode, name, equipmentTypeId, status | Linked to EquipmentType |
| EquipmentLedger | SoftDeleteEntity | equipmentCode, name, equipmentModelId, equipmentTypeId, factoryId, runStatus, mgmtStatus, entryDate, status | Asset ledger |

### Material (物料管理)


| Entity | Extends | Key Fields | Notes |
|--------|---------|------------|-------|
| MaterialCategory | SoftDeleteEntity | categoryCode, name, parentId | Tree structure |
| MaterialMaster | SoftDeleteEntity | materialCode, name, categoryId, uomId, status | Material master data |
| MaterialVersion | SoftDeleteEntity | materialId, version, status | Material versioning |
| InspectionExemption | SoftDeleteEntity | materialId, factoryId, exemptType | Inspection exemption |

### Supply Chain (供应链)


| Entity | Extends | Key Fields | Notes |
|--------|---------|------------|-------|
| Customer | SoftDeleteEntity | customerCode, name, shortCode, status | Customer master data |
| CustomerMaterial | BaseEntity | customerId, materialId, customerMaterialCode | Customer-specific material mapping |
| Supplier | SoftDeleteEntity | supplierCode, name, shortCode, status | Supplier master data |
| SupplierMaterial | BaseEntity | supplierId, materialId | Supplier-material mapping |

### Production (生产基础)


| Entity | Extends | Key Fields | Notes |
|--------|---------|------------|-------|
| WorkCenter | SoftDeleteEntity | workCenterCode, name, factoryId, status | Production work center |
| Process | SoftDeleteEntity | processCode, name, workCenterId, status | Process/operation |
| Uom | SoftDeleteEntity | uomCode, name, status | Unit of measure |
| UomConversion | SoftDeleteEntity | fromUomId, toUomId, conversionRate | UOM conversion |

### Permission (数据权限)


| Entity | Extends | Key Fields | Notes |
|--------|---------|------------|-------|
| DataPermissionGroup | SoftDeleteEntity | groupCode, name, description | Permission group |
| DataPermissionGroupFactory | BaseEntity | groupId, factoryId | Group-factory scope |
| DataPermissionGroupWorkCenter | BaseEntity | groupId, workCenterId | Group-workcenter scope |
| DataPermissionGroupProcess | BaseEntity | groupId, processId | Group-process scope |
| UserDataPermission | BaseEntity | userId, groupId | User-group assignment |
| UserDataPermissionFactory | BaseEntity | userPermissionId, factoryId | User-factory scope override |
| UserDataPermissionWorkCenter | BaseEntity | userPermissionId, workCenterId | User-workcenter scope override |
| UserDataPermissionProcess | BaseEntity | userPermissionId, processId | User-process scope override |

### System (系统)


| Entity | Extends | Key Fields | Notes |
|--------|---------|------------|-------|
| AuditLog | BaseEntity | entityType, entityId, action, changes (JSON), operatorId, operatorName | Immutable audit trail |
| ExampleEntity | BaseEntity | name, description | Template/example |

## Key DTO Patterns


Each Resource has 4 standard DTO types:

| DTO Suffix | Purpose | Fields |
|------------|---------|--------|
| `CreateDto` | POST request body | Required fields for creation |
| `UpdateDto` | PUT request body | Mutable fields only (immutable ones excluded) |
| `QueryDto` | GET @BeanParam query | Search/filter/pagination fields |
| `Dto` | Response body | Full entity representation |

**Shared DTOs:**
- `R<T>` — unified response wrapper
- `PagedResult<T>` — paginated result (records, total, current, size)
- `DropdownItem` — dropdown option (id, name)
- `AssociatedItemDto` / `AssociatedEntityDto` — cascade selector linked items
- `UserInfoDto` — current user info
- `PageDto` — pagination params (page, size)
