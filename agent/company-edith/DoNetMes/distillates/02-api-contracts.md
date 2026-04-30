---
type: edith-distillate
target_service: "DoNetMes"
created: "2026-04-29T09:15:00.000Z"
---

# DoNetMes — API 契约

## API 设计规范

### 动态 API 机制

Admin.NET 使用 Furion 的动态 API 功能，服务类继承 `BaseService<TEntity>` 并实现 `IDynamicApiController`，自动注册为 REST API 控制器。

**路由格式：** `/api/{ServiceName}/{MethodName}`

**响应格式：** 通过 `UnifyResult` 统一包装

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 服务类 | `{Entity}Service` | `SysUserService` |
| DTO | `{Entity}{Input/Output}` | `LoginInput`, `UserOutput` |
| 路由 | `/api/{服务名}/{方法名}` | `/api/sysUser/page` |

## 核心 API 端点

### 认证模块 (SysAuthService)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sysAuth/login` | POST | 用户登录，返回 JWT Token |
| `/api/sysAuth/refreshToken` | POST | 刷新过期 Token |
| `/api/sysAuth/logout` | GET | 退出登录 |
| `/api/sysAuth/userInfo` | GET | 获取当前用户信息 |

### 用户管理 (SysUserService)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sysUser/page` | GET | 分页查询用户列表 |
| `/api/sysUser/detail` | GET | 获取用户详情 |
| `/api/sysUser/add` | POST | 新增用户 |
| `/api/sysUser/update` | PUT | 更新用户信息 |
| `/api/sysUser/delete` | DELETE | 删除用户 |
| `/api/sysUser/setStatus` | POST | 设置用户状态 |
| `/api/sysUser/getOwnRoleList` | GET | 获取用户角色列表 |
| `/api/sysUser/getOwnOrgList` | GET | 获取用户机构列表 |

### 角色管理 (SysRoleService)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sysRole/page` | GET | 分页查询角色列表 |
| `/api/sysRole/detail` | GET | 获取角色详情 |
| `/api/sysRole/add` | POST | 新增角色 |
| `/api/sysRole/update` | PUT | 更新角色 |
| `/api/sysRole/delete` | DELETE | 删除角色 |
| `/api/sysRole/ownMenuList` | GET | 获取角色菜单权限 |
| `/api/sysRole/grantMenu` | POST | 授权角色菜单 |
| `/api/sysRole/ownDataScope` | GET | 获取角色数据范围 |
| `/api/sysRole/grantDataScope` | POST | 授权数据范围 |

### 菜单管理 (SysMenuService)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sysMenu/list` | GET | 获取菜单列表（树形） |
| `/api/sysMenu/detail` | GET | 获取菜单详情 |
| `/api/sysMenu/add` | POST | 新增菜单 |
| `/api/sysMenu/update` | PUT | 更新菜单 |
| `/api/sysMenu/delete` | DELETE | 删除菜单 |
| `/api/sysMenu/getMenuTree` | GET | 获取菜单树（用于授权） |

### 机构管理 (SysOrgService)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sysOrg/list` | GET | 获取机构列表（树形） |
| `/api/sysOrg/detail` | GET | 获取机构详情 |
| `/api/sysOrg/add` | POST | 新增机构 |
| `/api/sysOrg/update` | PUT | 更新机构 |
| `/api/sysOrg/delete` | DELETE | 删除机构 |

### 租户管理 (SysTenantService)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sysTenant/page` | GET | 分页查询租户列表 |
| `/api/sysTenant/detail` | GET | 获取租户详情 |
| `/api/sysTenant/add` | POST | 新增租户 |
| `/api/sysTenant/update` | PUT | 更新租户 |
| `/api/sysTenant/delete` | DELETE | 删除租户 |
| `/api/sysTenant/setStatus` | POST | 设置租户状态 |

### 代码生成 (SysCodeGenService)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sysCodeGen/page` | GET | 分页查询代码生成配置 |
| `/api/sysCodeGen/add` | POST | 新增代码生成配置 |
| `/api/sysCodeGen/update` | PUT | 更新配置 |
| `/api/sysCodeGen/delete` | DELETE | 删除配置 |
| `/api/sysCodeGen/preview` | POST | 预览生成代码 |
| `/api/sysCodeGen/generate` | POST | 生成代码 |

### 文件管理 (SysFileService)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sysFile/upload` | POST | 上传文件 |
| `/api/sysFile/download` | GET | 下载文件 |
| `/api/sysFile/page` | GET | 分页查询文件列表 |
| `/api/sysFile/delete` | DELETE | 删除文件 |

### 定时任务 (SysJobService)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sysJob/page` | GET | 分页查询任务列表 |
| `/api/sysJob/add` | POST | 新增定时任务 |
| `/api/sysJob/update` | PUT | 更新任务 |
| `/api/sysJob/delete` | DELETE | 删除任务 |
| `/api/sysJob/start` | POST | 启动任务 |
| `/api/sysJob/stop` | POST | 停止任务 |
| `/api/sysJob/trigger` | POST | 立即触发任务 |

## 认证流程

### JWT Token 机制

1. 用户调用 `/api/sysAuth/login` 提交用户名密码
2. 服务端验证后生成 JWT Token（包含用户 ID、租户 ID 等 Claims）
3. 前端在请求头中携带 `Authorization: Bearer {token}`
4. `JwtHandler` 验证 Token 有效性
5. Token 过期时调用 `/api/sysAuth/refreshToken` 刷新

### 权限验证流程

```
请求 → JwtHandler
  ├── 检查 Token 黑名单
  ├── 自动刷新过期 Token
  ├── 验证路由权限
  └── SuperAdmin 跳过权限检查
```

### 前端 API 封装示例

```typescript
import { http } from '@/utils/http'

// 登录
export const login = (data: { username: string; password: string }) =>
  http.post<R<LoginOutput>>('/api/sysAuth/login', data)

// 获取用户信息
export const getUserInfo = () => http.get<R<UserInfo>>('/api/sysAuth/userInfo')

// 分页查询
export const getUserPage = (params: PageParams) =>
  http.get<R<PageResult<SysUser>>>('/api/sysUser/page', { params })
```
