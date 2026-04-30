---
type: edith-distillate
target_service: "DoNetMes"
created: "2026-04-29T09:15:00.000Z"
---

# DoNetMes — 开发指南

## 开发环境搭建

### 后端环境

```bash
# 前置条件
- .NET 8.0 SDK 或 .NET 10.0 SDK
- IDE: Visual Studio 2022 / Rider / VS Code

# 克隆项目
git clone <repo-url>

# 构建
cd Admin.NET
dotnet build

# 运行
dotnet run --project Admin.NET.Web.Entry

# 访问
http://localhost:5050
```

### 前端环境

```bash
# 前置条件
- Node.js 18+
- pnpm

# 安装依赖
cd Web
pnpm install

# 开发模式
pnpm run dev    # 访问 http://localhost:5005

# 生产构建
pnpm run build
```

### Docker 部署

```bash
cd docker
docker-compose up -d

# 访问
前端: http://localhost:9100
后端: http://localhost:9102
数据库: localhost:9101 (MySQL)
缓存: localhost:6379 (Redis)
```

## 代码规范

### C# 代码风格

| 规范 | 示例 |
|------|------|
| 接口以 `I` 开头 | `IUserService` |
| 文件作用域命名空间 | `namespace Admin.NET.Core;` |
| 文件头部版权声明 | MIT/Apache 双许可 |
| API 文档特性 | `[DisplayName("用户管理")]` |

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 实体类 | PascalCase | `SysUser`, `SysMenu` |
| 服务类 | `{Entity}Service` | `SysUserService` |
| DTO | `{Entity}{Input/Output}` | `LoginInput`, `UserOutput` |
| 数据库表名 | PascalCase 或 snake_case | `SysUser` 或 `sys_user` |

### Git 工作流

- **主分支**：`v2`
- **提交格式**：表情 + 描述（如 "😎1、调整接口返回类型"）
- **插件开发**：独立目录，模块化开发

## 新模块开发流程

### 1. 创建实体

```csharp
// Admin.NET.Core/Entity/Business/
[SugarTable("BizOrder")]
[SugarIndex("index_order_tenant", nameof(TenantId))]
public class BizOrder : EntityBaseTenant
{
    [SugarColumn(ColumnDescription = "订单号", Length = 32)]
    public string OrderNo { get; set; }

    [SugarColumn(ColumnDescription = "客户名称", Length = 128)]
    public string CustomerName { get; set; }

    [SugarColumn(ColumnDescription = "订单金额", ColumnDataType = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [SugarColumn(ColumnDescription = "状态")]
    public int Status { get; set; }
}
```

### 2. 创建 DTO

```csharp
// Admin.NET.Application/Dtos/Business/
public class OrderInput : BaseIdInput
{
    [Required(ErrorMessage = "订单号不能为空")]
    public string OrderNo { get; set; }

    public string CustomerName { get; set; }
    public decimal Amount { get; set; }
}

public class OrderOutput : BaseIdOutput
{
    public string OrderNo { get; set; }
    public string CustomerName { get; set; }
    public decimal Amount { get; set; }
    public int Status { get; set; }
}
```

### 3. 创建服务

```csharp
// Admin.NET.Application/Services/Business/
public class BizOrderService : BaseService<BizOrder>, IDynamicApiController
{
    private readonly SqlSugarRepository<BizOrder> _rep;

    public BizOrderService(SqlSugarRepository<BizOrder> rep)
    {
        _rep = rep;
    }

    /// <summary>
    /// 分页查询订单
    /// </summary>
    [DisplayName("分页查询订单")]
    public async Task<PageResult<OrderOutput>> Page(PageInput input)
    {
        return await _rep.GetPageListAsync(input, p =>
            p.OrderNo.Contains(input.Keyword) ||
            p.CustomerName.Contains(input.Keyword));
    }

    /// <summary>
    /// 新增订单
    /// </summary>
    [DisplayName("新增订单")]
    public async Task Add(OrderInput input)
    {
        var order = input.Adapt<BizOrder>();
        await _rep.InsertAsync(order);
    }

    /// <summary>
    /// 更新订单
    /// </summary>
    [DisplayName("更新订单")]
    public async Task Update(OrderInput input)
    {
        var order = input.Adapt<BizOrder>();
        await _rep.UpdateAsync(order);
    }

    /// <summary>
    /// 删除订单
    /// </summary>
    [DisplayName("删除订单")]
    public async Task Delete(BaseIdInput input)
    {
        await _rep.DeleteByIdAsync(input.Id);
    }
}
```

### 4. 代码生成器（推荐）

使用内置代码生成器一键生成：
1. 打开 代码生成 页面
2. 选择数据库表
3. 配置字段属性
4. 一键生成前后端代码

## 配置系统

### 配置文件位置

```
Admin.NET.Web.Entry/Configuration/
├── App.json                  # 应用设置
├── Database.json             # 数据库配置
├── Cache.json                # 缓存配置
├── JWT.json                  # Token 配置
├── Upload.json               # 文件上传
├── Wechat.json               # 微信配置
├── Email.json                # 邮件配置
├── SMS.json                  # 短信配置
└── OAuth.json                # OAuth 配置
```

### 数据库配置示例

```json
{
  "DbConnection": {
    "EnableConsoleSql": false,
    "ConnectionConfigs": [{
      "ConfigId": "1300000000001",
      "DbType": "Sqlite",
      "ConnectionString": "DataSource=./Admin.NET.db",
      "DbSettings": {
        "EnableInitDb": true,
        "EnableInitTable": true,
        "EnableInitSeed": true
      }
    }]
  }
}
```

### 多数据库支持

| 数据库 | 配置 |
|--------|------|
| Sqlite | `"DbType": "Sqlite"` |
| MySQL | `"DbType": "MySql"` |
| PostgreSQL | `"DbType": "PostgreSQL"` |
| SQL Server | `"DbType": "SqlServer"` |
| Oracle | `"DbType": "Oracle"` |

## 测试规范

### 单元测试

```csharp
// Admin.NET.Test/
public class UserTest
{
    [Fact]
    public async Task GetUserDetail_ShouldReturnUser_WhenIdExists()
    {
        // Arrange
        var service = new SysUserService(...);
        
        // Act
        var result = await service.GetDetail(new BaseIdInput { Id = 1 });
        
        // Assert
        Assert.NotNull(result);
    }
}
```

### 测试命名规范

`{ClassName}{MethodName}{Scenario}{ExpectedResult}Test`

### 运行测试

```bash
dotnet test                                    # 运行所有测试
dotnet test --filter "FullyQualifiedName~UserTest"  # 运行特定测试
```

## 常见问题

### Q: 如何添加新的菜单权限？

1. 在 `SysMenu` 表中添加菜单记录
2. 配置 `Permission` 字段（如 `bizOrder`）
3. 在角色管理中授权该菜单
4. 前端使用 `v-auth="bizOrder"` 指令控制按钮显示

### Q: 如何实现多租户数据隔离？

1. 业务实体继承 `EntityBaseTenant`
2. 自动通过 `TenantId` 过滤
3. 租户间数据完全隔离

### Q: 如何自定义数据范围？

1. 角色设置 `DataScope = Custom`
2. 配置 `SysRoleOrg` 关联指定机构
3. 查询时自动过滤机构数据

### Q: 如何添加插件？

1. 在 `Plugins/` 目录创建新项目
2. 项目命名：`Admin.NET.Plugin.{Name}`
3. 实现 `IDynamicApiController` 接口
4. 编译后自动加载

## 性能优化建议

| 场景 | 建议 |
|------|------|
| 大量查询 | 使用分页 `GetPageListAsync` |
| 复杂查询 | 使用 SqlSugar 链式查询 |
| 缓存热点数据 | 使用 Redis 缓存 |
| 批量操作 | 使用 `InsertRangeAsync`、`UpdateRangeAsync` |
| 异步操作 | 使用 `async/await` 避免阻塞 |

## 国产化支持

| 能力 | 说明 |
|------|------|
| 国密算法 | SM2/SM3/SM4 加密 |
| 国产数据库 | 达梦、人大金仓等 |
| 国产操作系统 | 麒麟、统信等 |
| 等保合规 | 符合等级保护测评要求 |
