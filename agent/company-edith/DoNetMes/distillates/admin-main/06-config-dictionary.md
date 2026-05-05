# DoNetMes 数据字典与配置

## 核心枚举定义

### 状态枚举
```csharp
public enum StatusEnum
{
    Enable = 0,    // 启用
    Disable = 1    // 禁用
}
```

### 账号类型枚举
```csharp
public enum AccountTypeEnum
{
    SuperAdmin = 0, // 超级管理员
    SysAdmin = 1,   // 系统管理员
    Admin = 2,      // 管理员
    User = 3        // 普通用户
}
```

### 菜单类型枚举
```csharp
public enum MenuTypeEnum
{
    Dir = 1,   // 目录
    Menu = 2,  // 菜单
    Btn = 3    // 按钮
}
```

### 数据范围枚举
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

### 租户类型枚举
```csharp
public enum TenantTypeEnum
{
    Null = 0,          // 默认
    Db = 1             // 独立数据库
}
```

## 配置文件说明

### App.json (应用配置)
```json
{
  "AppSettings": {
    "AppName": "Admin.NET",
    "EnabledJob": true,
    "PrintDbSql": false,
    "EnabledSwagger": true,
    "Cors": {
      "WithOrigins": ["http://localhost:8000"]
    }
  }
}
```

### Database.json (数据库配置)
```json
{
  "ConnectionStrings": {
    "ConfigId": "MainDB",
    "ConnectionString": "Server=...;Database=admin_net;...",
    "DbType": "MySql",
    "IsAutoCloseConnection": true
  }
}
```

### JWT.json (JWT配置)
```json
{
  "JWTSettings": {
    "ValidIssuer": "Admin.NET",
    "ValidAudience": "Admin.NET",
    "IssuerSigningKey": "...",
    "Expire": 7200
  }
}
```

### Cache.json (缓存配置)
```json
{
  "CacheSettings": {
    "CacheType": "Memory",
    "Redis": {
      "ConnectionString": "localhost:6379"
    }
  }
}
```

## 缓存键常量
```csharp
public class CacheConst
{
    public const string KeyTenant = "sys:tenant:list";
    public const string KeyMenu = "sys:menu:list";
    public const string KeyRole = "sys:role:list";
    public const string KeyOrg = "sys:org:list";
    public const string KeyUser = "sys:user:";
    public const string KeyPasswordErrorTimes = "sys:pwd:err:";
    public const string KeyOnlineUser = "sys:online:";
    public const string KeyConfig = "sys:config:";
    public const string KeyDictData = "sys:dict:";
}
```

## 配置常量
```csharp
public class ConfigConst
{
    public const string SysPassword = "sys:password";                    // 默认密码
    public const string SysPasswordMaxErrorTimes = "sys:pwd:maxErr";     // 密码最大错误次数
    public const string SysDomainLogin = "sys:domain:login";             // 域登录开关
    public const string SysDefaultPassword = "123456";                   // 默认密码值
}
```

## SQL常量
```csharp
public class SqlSugarConst
{
    public const string ConfigId = "MainDB";
    public const string DefaultTenantId = "1234567890";
    public const string MainConfigId = "1234567890";
}
```

## 种子数据说明

### 菜单种子数据 (SysMenuSeedData)
- ID范围: 1310000000101 - 1310000000xxx
- 超管菜单ID: 1300000000101 (工作台)
- 系统管理ID: 1310000000101
- 平台管理ID: 1310000000301

### 角色种子数据 (SysRoleSeedData)
- 超级管理员角色
- 系统管理员角色
- 普通角色

### 机构种子数据 (SysOrgSeedData)
- 根节点机构

## 国际化资源
```
Resources/
├── Lang.en.json     # 英文
└── Lang.zh-CN.json  # 中文
```

---
*来源: Admin.NET.Core/Const, Configuration 分析*
