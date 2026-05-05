# DoNetMes 核心服务详解

## 服务列表 (36个)

### 1. SysAuthService (认证服务)
**职责**: 登录认证、JWT管理、验证码
```csharp
// 主要方法
Login(LoginInput input)              // 账号密码登录
GetLoginUser(long tenantId, ...)     // 获取登录用户
GetTenantIdByHostname(string host)   // 根据域名获取租户
Logout()                             // 退出登录
GetCaptchaImage()                    // 获取验证码
```

### 2. SysUserService (用户服务)
**职责**: 用户CRUD、角色授权、状态管理
```csharp
// 主要方法
Page(PageUserInput input)            // 用户分页
AddUser(AddUserInput input)          // 新增用户
UpdateUser(UpdateUserInput input)    // 更新用户
DeleteUser(BaseIdInput input)        // 删除用户
GetUserDetail(long id)               // 用户详情
ResetPassword(BaseIdInput input)     // 重置密码
SetStatus(BaseStatusInput input)     // 设置状态
GrantRole(UserRoleInput input)       // 授权角色
```

### 3. SysRoleService (角色服务)
**职责**: 角色管理、权限分配
```csharp
// 主要方法
Page(PageRoleInput input)            // 角色分页
GetList()                            // 角色列表
AddRole(AddRoleInput input)          // 新增角色
UpdateRole(UpdateRoleInput input)    // 更新角色
DeleteRole(BaseIdInput input)        // 删除角色
GrantMenu(RoleMenuInput input)       // 授权菜单
GrantOrg(RoleOrgInput input)         // 授权机构
GrantDataScope(...)                  // 授权数据范围
GrantApi(RoleApiInput input)         // 授权API
GrantTable(RoleTableInput input)     // 授权表
```

### 4. SysMenuService (菜单服务)
**职责**: 菜单树管理、权限标识
```csharp
// 主要方法
GetLoginMenuTree()                   // 获取登录菜单树
GetList(MenuInput input)             // 菜单列表
AddMenu(AddMenuInput input)          // 新增菜单
UpdateMenu(UpdateMenuInput input)    // 更新菜单
DeleteMenu(BaseIdInput input)        // 删除菜单
GetMenuTree()                        // 菜单树（授权用）
```

### 5. SysOrgService (机构服务)
**职责**: 组织架构管理
```csharp
// 主要方法
GetList()                            // 机构树列表
AddOrg(AddOrgInput input)            // 新增机构
UpdateOrg(UpdateOrgInput input)      // 更新机构
DeleteOrg(BaseIdInput input)         // 删除机构
GetUserOrgIdList()                   // 获取用户机构ID列表
GetChildIdListWithSelfById(long id)  // 获取子机构ID列表
```

### 6. SysTenantService (租户服务)
**职责**: 多租户管理
```csharp
// 主要方法
Page(PageTenantInput input)          // 租户分页
AddTenant(AddTenantInput input)      // 新增租户
UpdateTenant(...)                    // 更新租户
DeleteTenant(BaseIdInput input)      // 删除租户
GetTenant(long id)                   // 租户详情
CacheTenant()                        // 缓存租户列表
```

### 7. SysLogOpService (操作日志)
**职责**: 记录用户操作日志
```csharp
Page(PageLogOpInput input)           // 日志分页
ClearLog(ClearLogInput input)        // 清理日志
```

### 8. SysCacheService (缓存服务)
**职责**: Redis/MemoryCache 统一封装
```csharp
Get<T>(string key)                   // 获取缓存
Set<T>(string key, T value, ...)     // 设置缓存
Remove(string key)                   // 删除缓存
Exists(string key)                   // 检查缓存
```

### 9. SysCodeGenService (代码生成)
**职责**: 根据数据库表生成代码
```csharp
Page(PageCodeGenInput input)         // 代码生成配置分页
AddCodeGen(AddCodeGenInput input)    // 新增配置
Preview(long id)                     // 预览代码
Download(long id)                    // 下载代码
```

## 服务依赖关系
```
SysAuthService
├── UserManager
├── SysConfigService
├── SysCacheService
├── SysTenantService
└── SysLdapService

SysUserService
├── UserManager
├── SysOrgService
├── SysRoleService
├── SysUserRoleService
├── SysConfigService
├── SysOnlineUserService
├── SysCacheService
└── SysUserLdapService

SysRoleService
├── UserManager
├── SysRoleMenuService
├── SysRoleOrgService
├── SysRoleTableService
├── SysRoleApiService
├── SysOrgService
├── SysUserRoleService
├── SysCacheService
└── SysRoleDataPermService
```

## 服务注入模式
```csharp
// 1. 构造函数注入（推荐）
public class SysUserService : IDynamicApiController, ITransient
{
    private readonly UserManager _userManager;
    private readonly SysCacheService _sysCacheService;
    
    public SysUserService(UserManager userManager, SysCacheService sysCacheService)
    {
        _userManager = userManager;
        _sysCacheService = sysCacheService;
    }
}

// 2. 服务定位器模式（特殊场景）
var service = App.GetRequiredService<SysTenantService>();
```

## Repository 使用模式
```csharp
// 1. 直接注入
private readonly SqlSugarRepository<SysUser> _rep;

// 2. 切换仓储
var tenantRep = _rep.ChangeRepository<SqlSugarRepository<SysTenant>>();

// 3. 清除过滤器
_rep.AsQueryable().ClearFilter<ITenantIdFilter>()

// 4. 包含导航属性
_rep.AsQueryable().Includes(u => u.SysOrg)
```

## 工作单元
```csharp
[UnitOfWork]  // 事务控制
public virtual async Task<long> AddUser(AddUserInput input)
{
    // 整个方法在一个事务中
    var user = await _rep.AsInsertable(entity).ExecuteReturnEntityAsync();
    await UpdateRoleAndExtOrg(input);
    return user.Id;
}
```

---
*来源: Admin.NET.Core/Service 各模块分析*
