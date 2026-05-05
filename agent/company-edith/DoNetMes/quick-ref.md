# DoNetMes Quick Reference (Layer 1)

## 技术栈
- **后端**: .NET 8/10 + Furion + SqlSugar
- **前端**: Vue3 + Element Plus
- **数据库**: 支持多库（MySQL/SqlServer/PostgreSQL/Oracle/Sqlite）
- **认证**: JWT + 验证码 + LDAP + OAuth2

## 核心约束
| 约束 | 说明 |
|------|------|
| 雪花ID主键 | 所有实体继承 `EntityBaseId`，主键为 `long` 类型雪花ID |
| 软删除 | 继承 `EntityBase` 默认启用 `IsDelete` 字段 |
| 多租户隔离 | 继承 `EntityTenant` 自动注入 `TenantId` 过滤 |
| 数据权限 | 继承 `EntityBaseData` 自动注入 `CreateOrgId` 过滤 |
| 动态API | 所有 Service 实现 `IDynamicApiController` 自动暴露 API |

## 实体基类选择
```
EntityBaseId        → 仅需主键
EntityBase          → 主键 + 审计字段 + 软删除
EntityBaseData      → + 数据权限（机构过滤）
EntityTenant        → + 租户隔离
EntityTenantBaseData → + 租户 + 数据权限
```

## 权限模型 (RBAC)
```
用户(SysUser) → 用户角色(SysUserRole) → 角色(SysRole)
                                         ↓
                              角色菜单(SysRoleMenu) → 菜单(SysMenu)
                              角色机构(SysRoleOrg) → 机构(SysOrg)
                              角色数据权限(SysRoleDataPerm)
```

## 账号类型
| 类型 | 枚举值 | 权限范围 |
|------|--------|----------|
| SuperAdmin | 0 | 超级管理员，跨租户全权限 |
| SysAdmin | 1 | 系统管理员，本租户全权限 |
| Admin | 2 | 管理员，受权限控制 |
| User | 3 | 普通用户 |

## API 路由规范
- 基础路径: `/api/` + 服务名
- 命名约定: `PascalCase` → `camelCase`
- 方法名映射:
  - `GetList` → `GET /api/xxx/list`
  - `Add` → `POST /api/xxx/add`
  - `Update` → `POST /api/xxx/update`
  - `Delete` → `POST /api/xxx/delete`
  - `Page` → `GET /api/xxx/page`

## 核心服务清单 (36个)
| 服务 | 职责 | 关键表 |
|------|------|--------|
| SysAuthService | 认证登录 | SysUser |
| SysUserService | 用户管理 | SysUser |
| SysRoleService | 角色管理 | SysRole |
| SysMenuService | 菜单管理 | SysMenu |
| SysOrgService | 机构管理 | SysOrg |
| SysTenantService | 租户管理 | SysTenant |
| SysPosService | 职位管理 | SysPos |
| SysDictService | 字典管理 | SysDictType/SysDictData |
| SysConfigService | 系统配置 | SysConfig |
| SysLogOpService | 操作日志 | SysLogOp |
| SysLogExService | 异常日志 | SysLogEx |
| SysLogHttpService | HTTP日志 | SysLogHttp |
| SysCacheService | 缓存管理 | - |
| SysCodeGenService | 代码生成 | SysCodeGen |
| SysFileService | 文件管理 | SysFile |
| SysJobService | 定时任务 | SysJobDetail |
| SysNoticeService | 通知公告 | SysNotice |
| SysOnlineUserService | 在线用户 | - |

## 配置文件位置
```
Admin.NET.Application/Configuration/
├── App.json              # 应用配置
├── Database.json         # 数据库连接
├── Cache.json            # 缓存配置
├── JWT.json              # JWT配置
├── Logging.json          # 日志配置
├── OAuth.json            # OAuth配置
└── ...
```

## 菜单权限标识规范
```
{module}/{action}
示例:
- sysUser/page        # 用户分页查询
- sysUser/add         # 新增用户
- sysUser/update      # 更新用户
- sysUser/delete      # 删除用户
- sysRole/grantMenu   # 角色授权菜单
```

## 数据库种子数据 ID 范围
- 菜单: `1310000000101` - `1310000000xxx`
- 角色: 自增
- 机构: 自增
- 租户: 自增

## 常用枚举
| 枚举 | 用途 |
|------|------|
| StatusEnum | 启用/禁用状态 |
| MenuTypeEnum | Dir/Menu/Btn |
| AccountTypeEnum | 账号类型 |
| GenderEnum | 性别 |
| DataScopeEnum | 数据范围 |

---
*基于代码扫描自动生成，更新时间: 2026-05-02*
