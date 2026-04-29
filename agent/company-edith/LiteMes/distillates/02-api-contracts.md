本分片覆盖 [API Contracts]。来自服务: LiteMes。

---
type: edith-distillate
target_service: "LiteMes"
sources:
  - "LiteMes/docs/api-endpoints.md"
created: "2026-04-29T02:18:35.059Z"
---

# LiteMes — API Contracts

# LiteMes - API Endpoints



## API Conventions


All endpoints follow consistent REST patterns:

- **Base path**: `http://localhost:8080`
- **Request/Response**: JSON (`application/json`)
- **Auth**: Bearer JWT token (except `/api/auth/login`)
- **Response wrapper**: `R<T>` — `{ code, message, data, timestamp }`
- **Pagination**: `PagedResult<T>` — `{ records, total, current, size }`
- **HTTP conventions**:
  - `GET /api/{resource}` — paginated list with query filters (@BeanParam)
  - `GET /api/{resource}/{id}` — single entity by ID
  - `POST /api/{resource}` — create new entity (returns 201 + id)
  - `PUT /api/{resource}/{id}` — update entity
  - `DELETE /api/{resource}/{id}` — delete (soft-delete for applicable entities)
  - `PUT /api/{resource}/{id}/status?status={0|1}` — toggle enabled/disabled status

## Resource: Auth (`/api/auth`)


| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | User login, returns JWT token and user info | No |
| GET | `/api/auth/me` | Get current user info from JWT | Yes |

## Resource: Company (`/api/companies`)


Organization: 组织架构

| Method | Path | Description | Key Rules |
|--------|------|-------------|-----------|
| GET | `/api/companies` | Paginated list (filters: companyCode, name, status) | — |
| GET | `/api/companies/{id}` | Get company detail | — |
| POST | `/api/companies` | Create company (companyCode, name, shortCode) | Code must be unique, immutable after create |
| PUT | `/api/companies/{id}` | Update company (name, shortCode only) | Code cannot be changed |
| DELETE | `/api/companies/{id}` | Delete company | Blocked if referenced by Factory |
| PUT | `/api/companies/{id}/status?status={0\|1}` | Toggle enabled/disabled | Blocked if active Factory references it |

## Resource: Factory (`/api/factories`)


Organization: 组织架构

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/factories` | Paginated list |
| GET | `/api/factories/{id}` | Get factory detail |
| POST | `/api/factories` | Create factory |
| PUT | `/api/factories/{id}` | Update factory |
| DELETE | `/api/factories/{id}` | Delete factory |
| PUT | `/api/factories/{id}/status` | Toggle status |

## Resource: Department (`/api/departments`)


Organization: 组织架构

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/departments` | Paginated list |
| GET | `/api/departments/{id}` | Get department detail |
| POST | `/api/departments` | Create department |
| PUT | `/api/departments/{id}` | Update department |
| DELETE | `/api/departments/{id}` | Delete department |
| PUT | `/api/departments/{id}/status` | Toggle status |

## Resource: DepartmentUser (`/api/department-users`)


Organization: 组织架构

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/department-users` | Paginated list of department members |
| POST | `/api/department-users` | Assign user to department |
| DELETE | `/api/department-users/{id}` | Remove user from department |

## Resource: Shift (`/api/shifts`)


Organization: 组织架构

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/shifts` | Paginated list |
| GET | `/api/shifts/{id}` | Get shift detail |
| POST | `/api/shifts` | Create shift |
| PUT | `/api/shifts/{id}` | Update shift |
| DELETE | `/api/shifts/{id}` | Delete shift |

## Resource: ShiftSchedule (`/api/shift-schedules`)


Organization: 组织架构 — 班制班次管理

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/shift-schedules` | Paginated list |
| GET | `/api/shift-schedules/{id}` | Get schedule detail |
| POST | `/api/shift-schedules` | Create shift schedule |
| PUT | `/api/shift-schedules/{id}` | Update shift schedule |
| DELETE | `/api/shift-schedules/{id}` | Delete shift schedule |

## Resource: WorkCenter (`/api/work-centers`)


Production: 生产基础 — 工作中心

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/work-centers` | Paginated list |
| GET | `/api/work-centers/{id}` | Get work center detail |
| POST | `/api/work-centers` | Create work center |
| PUT | `/api/work-centers/{id}` | Update work center |
| DELETE | `/api/work-centers/{id}` | Delete work center |
| PUT | `/api/work-centers/{id}/status` | Toggle status |

## Resource: Process (`/api/processes`)


Production: 生产基础 — 工序管理

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/processes` | Paginated list |
| GET | `/api/processes/{id}` | Get process detail |
| POST | `/api/processes` | Create process |
| PUT | `/api/processes/{id}` | Update process |
| DELETE | `/api/processes/{id}` | Delete process |

## Resource: Uom (`/api/uoms`)


Production: 生产基础 — 计量单位

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/uoms` | Paginated list |
| GET | `/api/uoms/{id}` | Get UOM detail |
| POST | `/api/uoms` | Create UOM |
| PUT | `/api/uoms/{id}` | Update UOM |
| DELETE | `/api/uoms/{id}` | Delete UOM |

## Resource: UomConversion (`/api/uom-conversions`)


Production: 生产基础 — 单位换算

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/uom-conversions` | Paginated list |
| GET | `/api/uom-conversions/{id}` | Get conversion detail |
| POST | `/api/uom-conversions` | Create conversion rule |
| PUT | `/api/uom-conversions/{id}` | Update conversion rule |
| DELETE | `/api/uom-conversions/{id}` | Delete conversion rule |

## Resource: MaterialCategory (`/api/material-categories`)


Material: 物料管理 — 物料分类 (tree structure)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/material-categories` | Category tree (hierarchical) |
| GET | `/api/material-categories/{id}` | Get category detail |
| POST | `/api/material-categories` | Create category |
| PUT | `/api/material-categories/{id}` | Update category |
| DELETE | `/api/material-categories/{id}` | Delete category |

## Resource: Material (`/api/materials`)


Material: 物料管理 — 物料信息

| Method | Path | Description | Key Rules |
|--------|------|-------------|-----------|
| GET | `/api/materials` | Paginated list | — |
| GET | `/api/materials/{id}` | Get material detail | — |
| POST | `/api/materials` | Create material | Material code immutable after create |
| PUT | `/api/materials/{id}` | Update material | — |
| DELETE | `/api/materials/{id}` | Delete material | — |
| PUT | `/api/materials/{id}/status` | Toggle status | — |

## Resource: MaterialVersion (`/api/material-versions`)


Material: 物料管理 — 物料版本

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/material-versions` | Paginated list |
| GET | `/api/material-versions/{id}` | Get version detail |
| POST | `/api/material-versions` | Create material version |
| PUT | `/api/material-versions/{id}` | Update version |
| DELETE | `/api/material-versions/{id}` | Delete version |

## Resource: InspectionExemption (`/api/inspection-exemptions`)


Material: 物料管理 — 免检清单

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/inspection-exemptions` | Paginated list |
| GET | `/api/inspection-exemptions/{id}` | Get exemption detail |
| POST | `/api/inspection-exemptions` | Create exemption |
| PUT | `/api/inspection-exemptions/{id}` | Update exemption |
| DELETE | `/api/inspection-exemptions/{id}` | Delete exemption |

## Resource: EquipmentType (`/api/equipment-types`)


Equipment: 设备管理 — 设备类型

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/equipment-types` | Paginated list |
| GET | `/api/equipment-types/{id}` | Get type detail |
| POST | `/api/equipment-types` | Create equipment type |
| PUT | `/api/equipment-types/{id}` | Update equipment type |
| DELETE | `/api/equipment-types/{id}` | Delete equipment type |
| PUT | `/api/equipment-types/{id}/status` | Toggle status |

## Resource: EquipmentModel (`/api/equipment-models`)


Equipment: 设备管理 — 设备型号

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/equipment-models` | Paginated list |
| GET | `/api/equipment-models/{id}` | Get model detail |
| POST | `/api/equipment-models` | Create equipment model |
| PUT | `/api/equipment-models/{id}` | Update model |
| DELETE | `/api/equipment-models/{id}` | Delete model |
| PUT | `/api/equipment-models/{id}/status` | Toggle status |

## Resource: EquipmentLedger (`/api/equipment-ledger`)


Equipment: 设备管理 — 设备台账

| Method | Path | Description | Key Rules |
|--------|------|-------------|-----------|
| GET | `/api/equipment-ledger` | Paginated list (filters: code/name, type, model, runStatus, mgmtStatus, factory, status) | — |
| GET | `/api/equipment-ledger/{id}` | Get ledger detail | — |
| POST | `/api/equipment-ledger` | Create ledger entry (code, name, model, runStatus, mgmtStatus, factory, entryDate) | Code immutable after create |
| PUT | `/api/equipment-ledger/{id}` | Update ledger (name, model, status, factory etc; code and type read-only) | — |
| DELETE | `/api/equipment-ledger/{id}` | Soft-delete ledger | Logical delete |
| PUT | `/api/equipment-ledger/{id}/status` | Toggle status | — |

## Resource: Customer (`/api/customers`)


Supply Chain: 供应链 — 客户管理

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/customers` | Paginated list |
| GET | `/api/customers/{id}` | Get customer detail |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer |
| PUT | `/api/customers/{id}/status` | Toggle status |

## Resource: Supplier (`/api/suppliers`)


Supply Chain: 供应链 — 供应商管理

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/suppliers` | Paginated list |
| GET | `/api/suppliers/{id}` | Get supplier detail |
| POST | `/api/suppliers` | Create supplier |
| PUT | `/api/suppliers/{id}` | Update supplier |
| DELETE | `/api/suppliers/{id}` | Delete supplier |
| PUT | `/api/suppliers/{id}/status` | Toggle status |

## Resource: DataPermissionGroup (`/api/data-permission-groups`)


Permission: 数据权限 — 权限组

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/data-permission-groups` | Paginated list |
| GET | `/api/data-permission-groups/{id}` | Get group detail |
| POST | `/api/data-permission-groups` | Create permission group |
| PUT | `/api/data-permission-groups/{id}` | Update group |
| DELETE | `/api/data-permission-groups/{id}` | Delete group |

## Resource: UserDataPermission (`/api/user-data-permissions`)


Permission: 数据权限 — 用户权限分配

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user-data-permissions` | Paginated list |
| GET | `/api/user-data-permissions/{id}` | Get user permission detail |
| POST | `/api/user-data-permissions` | Assign permission to user |
| PUT | `/api/user-data-permissions/{id}` | Update user permission |
| DELETE | `/api/user-data-permissions/{id}` | Revoke user permission |
| POST | `/api/user-data-permissions/batch` | Batch assign permissions |

## Resource: AuditLog (`/api/audit-logs`)


System: 审计日志

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/audit-logs` | Paginated list with filters |

## Resource: Dropdown (`/api/dropdowns`)


System: 级联下拉选项

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dropdowns/companies` | Get company dropdown options |
| GET | `/api/dropdowns/factories?companyId=` | Get factory dropdown (filtered by company) |
| GET | `/api/dropdowns/departments?factoryId=` | Get department dropdown (filtered by factory) |

## Frontend API Modules (24 files)


Located in `frontend/src/api/`, one TypeScript module per backend resource. Each uses the shared Axios instance (`http.ts`) with JWT interceptor.

| API Module | Endpoint Base | Operations |
|------------|--------------|------------|
| auth.ts | /api/auth | login, getUserInfo |
| company.ts | /api/companies | list, getById, create, update, delete, updateStatus |
| factory.ts | /api/factories | list, getById, create, update, delete, updateStatus |
| department.ts | /api/departments | list, getById, create, update, delete, updateStatus |
| departmentUser.ts | /api/department-users | list, create, delete |
| shiftSchedule.ts | /api/shift-schedules | list, getById, create, update, delete |
| equipmentType.ts | /api/equipment-types | list, getById, create, update, delete, updateStatus |
| equipmentModel.ts | /api/equipment-models | list, getById, create, update, delete, updateStatus |
| equipmentLedger.ts | /api/equipment-ledger | list, getById, create, update, delete, updateStatus |
| materialCategory.ts | /api/material-categories | tree, getById, create, update, delete |
| material.ts | /api/materials | list, getById, create, update, delete, updateStatus |
| inspectionExemption.ts | /api/inspection-exemptions | list, getById, create, update, delete |
| customer.ts | /api/customers | list, getById, create, update, delete, updateStatus |
| supplier.ts | /api/suppliers | list, getById, create, update, delete, updateStatus |
| workCenter.ts | /api/work-centers | list, getById, create, update, delete, updateStatus |
| uom.ts | /api/uoms | list, getById, create, update, delete |
| uomConversion.ts | /api/uom-conversions | list, getById, create, update, delete |
| process.ts | /api/processes | list, getById, create, update, delete |
| dataPermissionGroup.ts | /api/data-permission-groups | list, getById, create, update, delete |
| userDataPermission.ts | /api/user-data-permissions | list, batchAssign |
| auditLog.ts | /api/audit-logs | list |
| dropdown.ts | /api/dropdowns | getCompanyDropdown, getFactoryDropdown, getDepartmentDropdown |
