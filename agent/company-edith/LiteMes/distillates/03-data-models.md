本分片覆盖 [Data Models]。来自服务: LiteMes。

---
type: edith-distillate
target_service: "LiteMes"
created: "2026-04-29T07:58:48.830Z"
---

# LiteMes — Data Models

- Permission: 数据权限 — 权限组
- Permission: 数据权限 — 用户权限分配
- BaseEntity (abstract)
- ├── id: Long (auto-increment, @TableId)
- ├── createdBy: String (@TableField INSERT)
- ├── createdAt: LocalDateTime (@TableField INSERT)
- ├── updatedBy: String (@TableField INSERT_UPDATE)
- └── updatedAt: LocalDateTime (@TableField INSERT_UPDATE)
- Entity: Extends, Key Fields, Notes
- DepartmentUser: BaseEntity, departmentId, userId, Many-to-many mapping
- Shift: BaseEntity, name, startTime, endTime, Shift definition
- CustomerMaterial: BaseEntity, customerId, materialId, customerMaterialCode, Customer-specific material mapping
- SupplierMaterial: BaseEntity, supplierId, materialId, Supplier-material mapping
- DataPermissionGroupFactory: BaseEntity, groupId, factoryId, Group-factory scope
- DataPermissionGroupWorkCenter: BaseEntity, groupId, workCenterId, Group-workcenter scope
- DataPermissionGroupProcess: BaseEntity, groupId, processId, Group-process scope
- UserDataPermission: BaseEntity, userId, groupId, User-group assignment
- UserDataPermissionFactory: BaseEntity, userPermissionId, factoryId, User-factory scope override
- UserDataPermissionWorkCenter: BaseEntity, userPermissionId, workCenterId, User-workcenter scope override
- UserDataPermissionProcess: BaseEntity, userPermissionId, processId, User-process scope override
- AuditLog: BaseEntity, entityType, entityId, action, changes (JSON), operatorId, operatorName, Immutable audit trail
- ExampleEntity: BaseEntity, name, description, Template/example
- DTO Suffix: Purpose, Fields
- `Dto`: Response body, Full entity representation
- `AssociatedItemDto` / `AssociatedEntityDto` — cascade selector linked items
- **ORM**: MyBatis-Plus 2.4.2
- Equipment: EquipmentType, EquipmentModel, EquipmentLedger, 3
- Equipment: /equipment-types, /equipment-models, /equipment-ledger
- 供应链主数据_功能设计_V1.0
- 数据权限_功能设计_V1.0
- 物料主数据_功能设计_V1.0
- 设备主数据_功能设计_V1.0
- 18 Playwright spec files covering: auth, org (company/department/factory/shift-schedule), equipment (ledger/model/type), material (category/material/inspection-exemption), supply-chain (customer/supplier), production (uom/uom-conversion/work-center), permission (group/user-permission).