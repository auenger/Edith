# DoNetMes 认证与权限体系

## 认证流程
```
客户端 → Login API → 验证码校验 → 账号验证 → 密码验证 → JWT生成 → 返回Token
                                      ↓
                              租户状态检查
                              账号状态检查
                              密码错误次数检查
```

## 登录接口
```csharp
// SysAuthService.Login
[AllowAnonymous]
public virtual async Task<LoginOutput> Login([Required] LoginInput input)
{
    // 1. 密码错误次数检查（缓存30分钟）
    // 2. 验证码校验（租户配置）
    // 3. 账号存在性检查
    // 4. 账号状态检查
    // 5. 租户状态检查
    // 6. 密码验证（支持LDAP域认证）
    // 7. 生成JWT Token
}
```

## JWT Token 结构
```json
{
  "aud": "Admin.NET",
  "iss": "Admin.NET",
  "UserId": "1234567890",
  "UserName": "admin",
  "Account": "admin",
  "AccountType": "0",
  "OrgId": "1234567890",
  "OrgName": "总公司",
  "TenantId": "1234567890",
  "SuperAdmin": "true",
  "SysAdmin": "false",
  "exp": 1234567890,
  "iat": 1234567890
}
```

## UserManager 核心属性
```csharp
public class UserManager
{
    public long UserId { get; }           // 用户ID
    public string Account { get; }        // 账号
    public string UserName { get; }       // 用户名
    public long OrgId { get; }            // 机构ID
    public string OrgName { get; }        // 机构名称
    public long TenantId { get; }         // 租户ID
    public bool SuperAdmin { get; }       // 是否超级管理员
    public bool SysAdmin { get; }         // 是否系统管理员
    public AccountTypeEnum AccountType { get; } // 账号类型
}
```

## RBAC 权限模型
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SysUser   │────→│ SysUserRole │←────│   SysRole   │
│  (用户表)    │     │ (用户角色)   │     │  (角色表)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ↓                          ↓                          ↓
             ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
             │ SysRoleMenu │           │  SysRoleOrg │           │SysRoleDataPerm│
             │ (角色菜单)   │           │ (角色机构)   │           │(角色数据权限) │
             └──────┬──────┘           └──────┬──────┘           └─────────────┘
                    ↓                          ↓
             ┌─────────────┐           ┌─────────────┐
             │   SysMenu   │           │    SysOrg   │
             │  (菜单表)    │           │  (机构表)    │
             └─────────────┘           └─────────────┘
```

## 菜单类型枚举
```csharp
public enum MenuTypeEnum
{
    Dir = 1,   // 目录
    Menu = 2,  // 菜单
    Btn = 3    // 按钮（权限）
}
```

## 权限标识命名规范
```
{模块}/{操作}
示例:
- sysUser/page          # 用户分页查询
- sysUser/add           # 新增用户
- sysUser/update        # 更新用户
- sysUser/delete        # 删除用户
- sysUser/detail        # 用户详情
- sysUser/grantRole     # 授权角色
- sysUser/resetPwd      # 重置密码
- sysUser/setStatus     # 设置状态
- sysRole/grantMenu     # 角色授权菜单
- sysRole/grantDataScope # 角色授权数据范围
```

## 数据权限范围
```csharp
public enum DataScopeEnum
{
    All = 1,           // 全部数据
    Define = 2,        // 自定义数据
    OrgWithChild = 3,  // 本机构及以下
    Org = 4,           // 仅本机构
    Self = 5           // 仅本人
}
```

## 角色权限授权流程
```csharp
// 1. 授权菜单
await _sysRoleMenuService.GrantRoleMenu(new RoleMenuInput 
{ 
    Id = roleId, 
    MenuIdList = menuIdList 
});

// 2. 授权机构
await _sysRoleOrgService.GrantRoleOrg(new RoleOrgInput 
{ 
    Id = roleId, 
    OrgIdList = orgIdList 
});

// 3. 授权数据权限
await _sysRoleDataPermService.GrantRoleDataScope(new RoleDataScopeInput 
{ 
    Id = roleId, 
    DataScope = DataScopeEnum.OrgWithChild,
    OrgIdList = orgIdList  // 自定义时使用
});

// 4. 授权API
await _sysRoleApiService.GrantRoleApi(new RoleApiInput 
{ 
    Id = roleId, 
    ApiList = apiList 
});
```

## 用户权限检查
```csharp
// 获取用户菜单ID列表
var menuIdList = await _sysUserMenuService.GetMenuIdListByUserId(userId);

// 获取用户机构ID列表
var orgIdList = await _sysOrgService.GetUserOrgIdList();

// 检查是否有某权限
var hasPermission = menuIdList.Contains(targetMenuId);
```

## 菜单树生成
```csharp
// 获取登录菜单树
public async Task<List<MenuOutput>> GetLoginMenuTree()
{
    if (_userManager.SuperAdmin)
    {
        // 超管获取所有菜单
        return await _sysMenuRep.AsQueryable()
            .Where(u => u.Status == StatusEnum.Enable)
            .ToTreeAsync(u => u.Children, u => u.Pid, 0);
    }
    else
    {
        // 普通用户获取授权菜单
        var menuIdList = await GetMenuIdList();
        return await _sysMenuRep.AsQueryable()
            .Where(u => u.Status == StatusEnum.Enable)
            .ToTreeAsync(u => u.Children, u => u.Pid, 0, 
                menuIdList.Select(d => (object)d).ToArray());
    }
}
```

## LDAP 域认证
```csharp
// 域认证流程
if (await _sysConfigService.GetConfigValueByCode<bool>(ConfigConst.SysDomainLogin))
{
    var userLdap = await GetUserLdap(user.Id, user.TenantId);
    if (userLdap != null)
    {
        // 使用LDAP认证
        await _sysLdapService.AuthAccount(tenantId, ldapAccount, password);
    }
    else
    {
        // 使用本地密码认证
        VerifyPassword(password, ...);
    }
}
```

## 验证码配置
```json
{
  "Captcha": {
    "CaptchaType": "zhangai",
    "Width": 150,
    "Height": 40,
    "Length": 4
  }
}
```

---
*来源: Admin.NET.Core/Service/Auth, User, Role, Menu 目录分析*
