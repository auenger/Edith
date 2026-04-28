---
type: "edith-quick-ref"
sources: ["LiteMes/docs/overview.md","LiteMes/docs/api-endpoints.md","LiteMes/docs/data-models.md"]
---
# LiteMes Quick-Ref

## Verify

```bash
# Backend (Quarkus dev mode)
cd /Users/ryan/mycode/LiteMes
./mvnw quarkus:dev           # Start backend (port 8080, Swagger at /q/swagger-ui)

# Frontend (Vite dev server)
cd /Users/ryan/mycode/LiteMes/frontend
npm install && npm run dev   # Start frontend (port 5173)

# E2E Tests
cd /Users/ryan/mycode/LiteMes/frontend
npm run test:e2e             # Run Playwright tests
npm run test:report          # View test report
```

## Key Constraints

| #  | Constraint                                                                                 | Impact                      |
| -- | ------------------------------------------------------------------------------------------ | --------------------------- |
| C1 | **公司编码不可变** — Company.companyCode 创建后不可修改                                                  | 新建必须谨慎填写编码                  |
| C2 | **设备台账编码不可变** — EquipmentLedger.equipmentCode 创建后不可修改                                      | 同上                          |
| C3 | **物料编码不可变** — MaterialMaster.materialCode 创建后不可修改                                          | 同上                          |
| C4 | **逻辑删除** — SoftDeleteEntity 子类使用 deleted 字段（1=删除, 0=活跃），MyBatis-Plus @TableLogic 自动过滤      | 物理删除不发生，SQL 需手动处理           |
| C5 | **统一响应格式** — 所有 API 返回 `R<T>` = `{code, message, data, timestamp}`                         | 前端 axios 解包时注意 .data.data   |
| C6 | **JWT 认证** — 除 /api/auth/login 外所有端点需要 Bearer Token                                        | 前端 axios 拦截器自动附加，401 自动跳转登录 |
| C7 | **级联依赖** — Company→Factory→Department 三级级联，EquipmentType→EquipmentModel→EquipmentLedger 三级 | 删除上级时检查下级引用                 |
| C8 | **状态切换** — 禁用 Company/Factory/Equipment 等实体验证是否被活跃子实体引用                                    | 禁用前需清理引用                    |

## Common Pitfalls

1. **编码唯一性** — Company、Factory、Equipment、Material 等实体编码在创建时校验唯一性，重复编码会抛 BusinessException

2. **级联选择器依赖** — 前端 `CascadingSelector` 组件依赖 `/api/dropdowns/*` 接口三级联动，数据不完整时组件不可用

3. **Swagger 路径** — OpenAPI spec 在 `/q/openapi`，Swagger UI 在 `/q/swagger-ui`，非 `/swagger-ui`

4. **CORS** — 仅允许 localhost:3000 和 localhost:5173，其他前端地址需要修改 application.yml

5. **MyBatis-Plus 自动填充** — AuditMetaObjectHandler 自动设置 createdBy/updatedBy，需要 JWT 上下文中有用户信息

## API Endpoints (速览)

所有资源遵循统一 CRUD 模式：

| Pattern | Method | Path                                        | Returns                                  |
| ------- | ------ | ------------------------------------------- | ---------------------------------------- |
| 列表查询    | GET    | `/api/{resource}`                           | `R<PagedResult<Dto>>` (支持 @BeanParam 筛选) |
| 详情查询    | GET    | `/api/{resource}/{id}`                      | `R<Dto>`                                 |
| 新增      | POST   | `/api/{resource}`                           | `Response(201) + R<Long>`                |
| 编辑      | PUT    | `/api/{resource}/{id}`                      | `R<Void>`                                |
| 删除      | DELETE | `/api/{resource}/{id}`                      | `R<Void>`                                |
| 状态切换    | PUT    | `/api/{resource}/{id}/status?status={0\|1}` | `R<Void>`                                |

### 各领域关键端点差异

| 资源                 | 特殊端点/差异                                              |
| ------------------ | ---------------------------------------------------- |
| Auth               | POST `/api/auth/login` (无需Token), GET `/api/auth/me` |
| DepartmentUser     | POST 分配用户, DELETE 移除用户（无PUT更新）                       |
| MaterialCategory   | GET 返回树结构 (MaterialCategoryTreeDto)                  |
| Shift              | Shift+ShiftSchedule 为独立资源，无状态切换                      |
| UserDataPermission | POST `/api/user-data-permissions/batch` 批量分配         |
| AuditLog           | 仅 GET 列表查询（只读，不可增删改）                                 |
| Dropdown           | GET 三个级联查询端点（companies, factories, departments）      |

## Data Models (速览)

* **34 实体** — 所有业务实体继承 `BaseEntity`(审计字段) 或 `SoftDeleteEntity`(逻辑删除)

* **审计追踪** — createdBy/createdAt/updatedBy/updatedAt 由 AuditMetaObjectHandler 自动维护

* **DTO 模式** — 每个资源配套 CreateDto/UpdateDto/QueryDto/Dto 四件套 + R/PagedResult 通用包装

* **权限模型** — DataPermissionGroup → (Factory/WorkCenter/Process 三级范围) → UserDataPermission → 用户级覆盖

## Configuration (关键配置)

| 配置项          | 值                               | 说明                  |
| ------------ | ------------------------------- | ------------------- |
| Port         | 8080                            | Quarkus HTTP        |
| DB           | mysql://localhost:3306/litemes  | MySQL 8.x           |
| Redis        | redis://localhost:6379          | 缓存/会话               |
| JWT Issuer   | <https://litemes.com>           | JWT 签名验证            |
| CORS Origins | localhost:3000, localhost:5173  | 跨域白名单               |
| Log Level    | INFO (prod) / DEBUG-TRACE (dev) | `%dev` profile 自动切换 |

## Deep Dive (Layer 2)

* Overview: `LiteMes/distillates/01-overview.md`

* API contracts: `LiteMes/distillates/02-api-contracts.md`

* Data models: `LiteMes/distillates/03-data-models.md`

* Business logic: `LiteMes/distillates/04-business-logic.md`

⠀