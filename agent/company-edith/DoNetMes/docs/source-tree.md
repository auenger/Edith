# DoNetMes — 源码树分析

**生成日期：** 2026-04-29

## 目录结构（带用途注解）

```text
DoNetMes/
├── Admin.NET/
│   ├── Admin.NET-City.db/
│   │   └── Admin.NET-City.db
│   ├── Admin.NET.Application/
│   │   ├── bin/
│   │   │   └── Debug/
│   │   ├── Configuration/
│   │   │   ├── Alipay.json
│   │   │   ├── APIJSON.json
│   │   │   ├── App.Development.json
│   │   │   ├── App.json
│   │   │   ├── Cache.json
│   │   │   ├── Captcha.json
│   │   │   ├── CodeGen.json
│   │   │   ├── Database.Development.json
│   │   │   ├── Database.json
│   │   │   ├── Email.json
│   │   │   ├── Enum.json
│   │   │   ├── HttpRemote.Development.json
│   │   │   ├── HttpRemote.json
│   │   │   ├── JWT.json
│   │   │   ├── Limit.json
│   │   │   ├── Logging.json
│   │   │   ├── MessageQueue.json
│   │   │   ├── MessageTemplate.json
│   │   │   ├── Mqtt.json
│   │   │   ├── OAuth.json
│   │   │   └── ... (4 more)
│   │   ├── Const/
│   │   │   ├── AppClaimConst.cs
│   │   │   └── ApplicationConst.cs
│   │   ├── Entity/
│   │   │   ├── Test.cs
│   │   │   ├── TestCodeGenDemo.cs
│   │   │   └── TestViewSysUser.cs
│   │   ├── EventBus/
│   │   │   └── AppEventSubscriber.cs
│   │   ├── Mqtt/
│   │   │   └── TestMqttEventInterceptor.cs
│   │   ├── obj/
│   │   │   ├── Debug/
│   │   │   ├── Admin.NET.Application.csproj.nuget.dgspec.json
│   │   │   ├── Admin.NET.Application.csproj.nuget.g.props
│   │   │   ├── Admin.NET.Application.csproj.nuget.g.targets
│   │   │   ├── project.assets.json
│   │   │   └── project.nuget.cache
│   │   ├── Option/
│   │   │   └── HttpRemoteOptions.cs
│   │   ├── SeedData/
│   │   │   ├── SysMenuSeedData.cs
│   │   │   ├── SysSerialSeedData.cs
│   │   │   └── SysTenantSeedData.cs
│   │   ├── Serial/
│   │   │   ├── SerialSlotProvider.cs
│   │   │   └── SerialTypeProvider.cs
│   │   ├── Service/
│   │   │   ├── App/
│   │   │   ├── LLM/
│   │   │   └── Test/
│   │   ├── Admin.NET.Application.csproj
│   │   ├── GlobalUsings.cs
│   │   └── Startup.cs
│   ├── Admin.NET.Core/
│   │   ├── ApiKeyAuth/
│   │   │   ├── ApiKeyAuthenticationHandler.cs
│   │   │   └── ApiKeyAuthenticationOptions.cs
│   │   ├── Attribute/
│   │   │   ├── AppApiDescriptionAttribute.cs
│   │   │   ├── BindSerialAttribute.cs
│   │   │   ├── CodeGenStrategyAttribute.cs
│   │   │   ├── ConstAttribute.cs
│   │   │   ├── CustomJsonPropertyAttribute.cs
│   │   │   ├── DataMaskAttribute.cs
│   │   │   ├── DataPermAttribute.cs
│   │   │   ├── DateTimeRangeAttribute.cs
│   │   │   ├── DictAttribute.cs
│   │   │   ├── EnumAttribute.cs
│   │   │   ├── HttpRemoteApiAttribute.cs
│   │   │   ├── IdCardNoAttribute.cs
│   │   │   ├── IdempotentAttribute.cs
│   │   │   ├── IgnoreTableAttribute.cs
│   │   │   ├── IgnoreUpdateSeedAttribute.cs
│   │   │   ├── IgnoreUpdateSeedColumnAttribute.cs
│   │   │   ├── ImportDictAttribute.cs
│   │   │   ├── IncreSeedAttribute.cs
│   │   │   ├── IncreTableAttribute.cs
│   │   │   ├── JsonConverterNewtonsoft.cs
│   │   │   └── ... (11 more)
│   │   ├── bin/
│   │   │   └── Debug/
│   │   ├── Cache/
│   │   │   ├── CacheSetup.cs
│   │   │   └── CaptchaDistributedCache.cs
│   │   ├── CodeGen/
│   │   │   ├── Engines/
│   │   │   ├── Models/
│   │   │   ├── Strategies/
│   │   │   └── CodeGenStrategyFactory.cs
│   │   ├── Const/
│   │   │   ├── AlipayConst.cs
│   │   │   ├── CacheConst.cs
│   │   │   ├── ClaimConst.cs
│   │   │   ├── CommonConst.cs
│   │   │   ├── ConfigConst.cs
│   │   │   └── SqlSugarConst.cs
│   │   ├── Entity/
│   │   │   ├── EntityBase.cs
│   │   │   ├── IEntityFilter.cs
│   │   │   ├── SysAlipayAuthInfo.cs
│   │   │   ├── SysAlipayTransaction.cs
│   │   │   ├── SysCodeGen.cs
│   │   │   ├── SysCodeGenColumn.cs
│   │   │   ├── SysCodeGenTable.cs
│   │   │   ├── SysColumnCustom.cs
│   │   │   ├── SysConfig.cs
│   │   │   ├── SysDictData.cs
│   │   │   ├── SysDictType.cs
│   │   │   ├── SysFile.cs
│   │   │   ├── SysFileContent.cs
│   │   │   ├── SysJobCluster.cs
│   │   │   ├── SysJobDetail.cs
│   │   │   ├── SysJobTrigger.cs
│   │   │   ├── SysJobTriggerRecord.cs
│   │   │   ├── SysLdap.cs
│   │   │   ├── SysLogDiff.cs
│   │   │   ├── SysLogEvent.cs
│   │   │   └── ... (38 more)
│   │   ├── Enum/
│   │   │   ├── AccountTypeEnum.cs
│   │   │   ├── AlipayCertTypeEnum.cs
│   │   │   ├── AlipayIdentityTypeEnum.cs
│   │   │   ├── CacheTypeEnum.cs
│   │   │   ├── CardTypeEnum.cs
│   │   │   ├── CodeGenEffectTypeEnum.cs
│   │   │   ├── CodeGenFromRuleValidEnum.cs
│   │   │   ├── CodeGenMethodEnum.cs
│   │   │   ├── CodeGenPrintTypeEnum.cs
│   │   │   ├── CodeGenQueryTypeEnum.cs
│   │   │   ├── CodeGenSceneEnum.cs
│   │   │   ├── CodeGenTypeEnum.cs
│   │   │   ├── CryptogramEnum.cs
│   │   │   ├── CultureLevelEnum.cs
│   │   │   ├── DataOpTypeEnum.cs
│   │   │   ├── DataScopeEnum.cs
│   │   │   ├── ElasticSearchAuthTypeEnum.cs
│   │   │   ├── ErrorCodeEnum.cs
│   │   │   ├── EventStatusEnum.cs
│   │   │   ├── FilterLogicEnum.cs
│   │   │   └── ... (29 more)
│   │   ├── EventBus/
│   │   │   ├── AppEventSubscriber.cs
│   │   │   ├── EventConsumer.cs
│   │   │   ├── EventHandlerMonitor.cs
│   │   │   ├── RabbitMQEventSourceStore.cs
│   │   │   ├── RedisEventSourceStorer.cs
│   │   │   ├── RedisQueue.cs
│   │   │   └── RetryEventHandlerExecutor.cs
│   │   ├── Extension/
│   │   │   ├── ConsoleLogoSetup.cs
│   │   │   ├── DataTypeExtension.cs
│   │   │   ├── EnumerableExtensions.cs
│   │   │   ├── EnumExtension.cs
│   │   │   ├── HttpContextExtension.cs
│   │   │   ├── HttpRemotesExtension.cs
│   │   │   ├── ObjectExtension.cs
│   │   │   ├── ParseExtensions.cs
│   │   │   ├── RepositoryExtension.cs
│   │   │   ├── StringExtension.cs
│   │   │   ├── SwaggerHeaderTenantFilter.cs
│   │   │   ├── UseApplicationBuilder.cs
│   │   │   ├── YitIdHelperExtension.cs
│   │   │   └── YitIdInitHelper.cs
│   │   ├── Hub/
│   │   │   ├── Dto/
│   │   │   ├── IOnlineUserHub.cs
│   │   │   └── OnlineUserHub.cs
│   │   ├── Job/
│   │   │   ├── CleanSysLogJob.cs
│   │   │   ├── DynamicJobCompiler.cs
│   │   │   ├── MqttHostedService.cs
│   │   │   └── StartHostedService.cs
│   │   ├── Logging/
│   │   │   ├── DatabaseLoggingWriter.cs
│   │   │   ├── ElasticSearchLoggingWriter.cs
│   │   │   ├── ElasticSearchSetup.cs
│   │   │   ├── HttpLoggingHandler.cs
│   │   │   ├── LogExceptionHandler.cs
│   │   │   ├── LoggingMonitorDto.cs
│   │   │   └── LoggingSetup.cs
│   │   ├── Mqtt/
│   │   │   ├── DefaultMqttEventInterceptor.cs
│   │   │   └── MqttEventInterceptor.cs
│   │   ├── obj/
│   │   │   ├── Debug/
│   │   │   ├── Admin.NET.Core.csproj.nuget.dgspec.json
│   │   │   ├── Admin.NET.Core.csproj.nuget.g.props
│   │   │   ├── Admin.NET.Core.csproj.nuget.g.targets
│   │   │   ├── project.assets.json
│   │   │   └── project.nuget.cache
│   │   ├── Option/
│   │   │   ├── AlipayOptions.cs
│   │   │   ├── APIJSONOptions.cs
│   │   │   ├── CacheOptions.cs
│   │   │   ├── CodeGenOptions.cs
│   │   │   ├── DbConnectionOptions.cs
│   │   │   ├── ElasticSearchOptions.cs
│   │   │   ├── EmailOptions.cs
│   │   │   ├── EnumOptions.cs
│   │   │   ├── HttpProxyOptions.cs
│   │   │   ├── MqttOptions.cs
│   │   │   ├── OAuthOptions.cs
│   │   │   ├── PayCallBackOptions.cs
│   │   │   ├── RateLimitOptions.cs
│   │   │   ├── SMSOptions.cs
│   │   │   ├── SnowIdOptions.cs
│   │   │   ├── UploadOptions.cs
│   │   │   ├── WechatOptions.cs
│   │   │   └── WechatPayOptions.cs
│   │   ├── RabbitMQ/
│   │   │   ├── IMessageHandler.cs
│   │   │   ├── RabbitMqConnection.cs
│   │   │   ├── RabbitMqConsumer.cs
│   │   │   ├── RabbitMqConsumerOptions.cs
│   │   │   ├── RabbitMqOptions.cs
│   │   │   ├── RabbitMqProducer.cs
│   │   │   └── RabbitMQSetup.cs
│   │   ├── Resources/
│   │   │   ├── Lang.en.json
│   │   │   └── Lang.zh-CN.json
│   │   ├── SeedData/
│   │   │   ├── SysConfigSeedData.cs
│   │   │   ├── SysDictDataSeedData.cs
│   │   │   ├── SysDictTypeSeedData.cs
│   │   │   ├── SysMenuSeedData.cs
│   │   │   ├── SysNoticeSeedData.cs
│   │   │   ├── SysOrgSeedData.cs
│   │   │   ├── SysPosSeedData.cs
│   │   │   ├── SysRoleMenuSeedData.cs
│   │   │   ├── SysRoleSeedData.cs
│   │   │   ├── SysTenantSeedData.cs
│   │   │   ├── SysUserExtOrgSeedData.cs
│   │   │   ├── SysUserRoleSeedData.cs
│   │   │   └── SysUserSeedData.cs
│   │   ├── Service/
│   │   │   ├── Alipay/
│   │   │   ├── APIJSON/
│   │   │   ├── Auth/
│   │   │   ├── Cache/
│   │   │   ├── CodeGen/
│   │   │   ├── ColumnCustom/
│   │   │   ├── Common/
│   │   │   ├── Config/
│   │   │   ├── Const/
│   │   │   ├── DataBase/
│   │   │   ├── Dict/
│   │   │   ├── Enum/
│   │   │   ├── File/
│   │   │   ├── Job/
│   │   │   ├── Log/
│   │   │   ├── Menu/
│   │   │   ├── Message/
│   │   │   ├── Mqtt/
│   │   │   ├── Notice/
│   │   │   ├── OAuth/
│   │   │   └── ... (17 more)
│   │   └── ... (6 more)
│   ├── Admin.NET.Test/
│   │   ├── Attribute/
│   │   │   ├── IdempotentTest.cs
│   │   │   └── RequiredIFTest.cs
│   │   ├── bin/
│   │   │   └── Debug/
│   │   ├── obj/
│   │   │   ├── Debug/
│   │   │   ├── Admin.NET.Test.csproj.nuget.dgspec.json
│   │   │   ├── Admin.NET.Test.csproj.nuget.g.props
│   │   │   ├── Admin.NET.Test.csproj.nuget.g.targets
│   │   │   ├── project.assets.json
│   │   │   └── project.nuget.cache
│   │   ├── Utils/
│   │   │   └── CustomJsonHelperTest.cs
│   │   ├── Admin.NET.Test.csproj
│   │   ├── GlobalUsings.cs
│   │   └── Program.cs
│   ├── Admin.NET.Web.Core/
│   │   ├── bin/
│   │   │   └── Debug/
│   │   ├── Component/
│   │   │   ├── ApplicationComponent.cs
│   │   │   └── WebComponent.cs
│   │   ├── Handlers/
│   │   │   └── JwtHandler.cs
│   │   ├── obj/
│   │   │   ├── Debug/
│   │   │   ├── Admin.NET.Web.Core.csproj.nuget.dgspec.json
│   │   │   ├── Admin.NET.Web.Core.csproj.nuget.g.props
│   │   │   ├── Admin.NET.Web.Core.csproj.nuget.g.targets
│   │   │   ├── project.assets.json
│   │   │   └── project.nuget.cache
│   │   ├── Admin.NET.Web.Core.csproj
│   │   ├── ProjectOptions.cs
│   │   └── Startup.cs
│   ├── Admin.NET.Web.Entry/
│   │   ├── Alipaycrt/
│   │   │   ├── alipayPublicCert.crt
│   │   │   ├── alipayRootCert.crt
│   │   │   └── appPublicCert.crt
│   │   ├── bin/
│   │   │   └── Debug/
│   │   ├── Controllers/
│   │   │   └── HomeController.cs
│   │   ├── logs/
│   │   │   ├── 20260429_Error.log
│   │   │   ├── 20260429_Information.log
│   │   │   └── 20260429_Warning.log
│   │   ├── obj/
│   │   │   ├── Debug/
│   │   │   ├── Admin.NET.Web.Entry.csproj.nuget.dgspec.json
│   │   │   ├── Admin.NET.Web.Entry.csproj.nuget.g.props
│   │   │   ├── Admin.NET.Web.Entry.csproj.nuget.g.targets
│   │   │   ├── project.assets.json
│   │   │   └── project.nuget.cache
│   │   ├── Properties/
│   │   │   └── launchSettings.json
│   │   ├── Views/
│   │   │   ├── Home/
│   │   │   ├── Shared/
│   │   │   ├── _ViewImports.cshtml
│   │   │   └── _ViewStart.cshtml
│   │   ├── wwwroot/
│   │   │   ├── images/
│   │   │   ├── template/
│   │   │   └── bind_wx_user.html
│   │   ├── Admin.NET.Web.Entry.csproj
│   │   ├── appsettings.Development.json
│   │   ├── appsettings.json
│   │   ├── Dockerfile
│   │   ├── FakeStartup.cs
│   │   ├── GeoLite2-City.mmdb
│   │   ├── ip2region.db
│   │   ├── Program.cs
│   │   ├── sensitive-words.txt
│   │   ├── SingleFilePublish.cs
│   │   └── web.config
│   ├── Plugins/
│   │   ├── Admin.NET.Plugin.Ai/
│   │   │   ├── bin/
│   │   │   ├── Configuration/
│   │   │   ├── Const/
│   │   │   ├── Entity/
│   │   │   ├── Enum/
│   │   │   ├── Extention/
│   │   │   ├── Handler/
│   │   │   ├── Interface/
│   │   │   ├── Model/
│   │   │   ├── obj/
│   │   │   ├── Option/
│   │   │   ├── Service/
│   │   │   ├── Utils/
│   │   │   ├── Admin.NET.Plugin.Ai.csproj
│   │   │   ├── GlobalUsings.cs
│   │   │   └── Startup.cs
│   │   ├── Admin.NET.Plugin.DataApproval/
│   │   │   ├── bin/
│   │   │   ├── Configuration/
│   │   │   ├── Const/
│   │   │   ├── Entity/
│   │   │   ├── Middleware/
│   │   │   ├── obj/
│   │   │   ├── SeedData/
│   │   │   ├── Service/
│   │   │   ├── Admin.NET.Plugin.DataApproval.csproj
│   │   │   ├── GlobalUsings.cs
│   │   │   └── Startup.cs
│   │   ├── Admin.NET.Plugin.DingTalk/
│   │   │   ├── bin/
│   │   │   ├── Configuration/
│   │   │   ├── Const/
│   │   │   ├── Entity/
│   │   │   ├── Enum/
│   │   │   ├── Job/
│   │   │   ├── obj/
│   │   │   ├── Option/
│   │   │   ├── Service/
│   │   │   ├── Admin.NET.Plugin.DingTalk.csproj
│   │   │   ├── GlobalUsings.cs
│   │   │   └── Startup.cs
│   │   ├── Admin.NET.Plugin.GoView/
│   │   │   ├── bin/
│   │   │   ├── Configuration/
│   │   │   ├── Const/
│   │   │   ├── Entity/
│   │   │   ├── Enum/
│   │   │   ├── obj/
│   │   │   ├── Service/
│   │   │   ├── Utils/
│   │   │   ├── Admin.NET.Plugin.GoView.csproj
│   │   │   ├── GlobalUsings.cs
│   │   │   └── Startup.cs
│   │   ├── Admin.NET.Plugin.K3Cloud/
│   │   │   ├── bin/
│   │   │   ├── Configuration/
│   │   │   ├── obj/
│   │   │   ├── Option/
│   │   │   ├── Service/
│   │   │   ├── Admin.NET.Plugin.K3Cloud.csproj
│   │   │   ├── GlobalUsings.cs
│   │   │   └── Startup.cs
│   │   ├── Admin.NET.Plugin.PaddleOCR/
│   │   │   ├── bin/
│   │   │   ├── Configuration/
│   │   │   ├── Const/
│   │   │   ├── obj/
│   │   │   ├── Service/
│   │   │   ├── Utils/
│   │   │   ├── Admin.NET.Plugin.PaddleOCR.csproj
│   │   │   └── GlobalUsings.cs
│   │   ├── Admin.NET.Plugin.ReZero/
│   │   │   ├── bin/
│   │   │   ├── Configuration/
│   │   │   ├── obj/
│   │   │   ├── Option/
│   │   │   ├── SeedData/
│   │   │   ├── Service/
│   │   │   ├── Admin.NET.Plugin.ReZero.csproj
│   │   │   ├── GlobalUsings.cs
│   │   │   └── Startup.cs
│   │   └── Admin.NET.Plugin.WorkWeixin/
│   │       ├── bin/
│   │       ├── Configuration/
│   │       ├── Const/
│   │       ├── obj/
│   │       ├── SeedData/
│   │       ├── Service/
│   │       ├── Admin.NET.Plugin.WorkWeixin.csproj
│   │       ├── GlobalUsings.cs
│   │       └── Startup.cs
│   ├── Admin.NET-City.db.7z
│   ├── Admin.NET.sln
│   ├── dot_net_10.bat
│   └── dot_net_8.bat
├── App/
│   ├── api/  ← API 定义
│   │   └── base/
│   │       ├── index.ts
│   │       ├── request.ts
│   │       └── 自动生成接口的方法.txt
│   ├── api_all/
│   │   ├── appAuth.ts
│   │   ├── appH5Demo.ts
│   │   ├── sysAuth.ts
│   │   ├── sysCommon.ts
│   │   └── sysLogOp.ts
│   ├── pages/  ← 页面
│   │   ├── about/
│   │   │   └── about.vue
│   │   ├── component/
│   │   │   ├── BusinessOverview.vue
│   │   │   ├── OrderOverview.vue
│   │   │   ├── sysLogOp.vue
│   │   │   └── tabbar.vue
│   │   ├── feedback/
│   │   │   └── feedback.vue
│   │   ├── home/
│   │   │   └── home.vue
│   │   ├── login/
│   │   │   └── login.vue
│   │   ├── mine/
│   │   │   └── mine.vue
│   │   └── password/
│   │       └── password.vue
│   ├── static/  ← 静态资源
│   │   ├── swiper/
│   │   │   ├── swiper1.png
│   │   │   ├── swiper2.png
│   │   │   └── swiper3.png
│   │   ├── tabIcon/
│   │   │   ├── home.png
│   │   │   └── user.png
│   │   ├── bg.jpg
│   │   └── logo.png
│   ├── utils/  ← 工具函数
│   │   ├── authFunction.ts
│   │   ├── encrypt.js
│   │   ├── getUrlParam.js
│   │   ├── http.js
│   │   ├── request.js
│   │   └── validate.js
│   ├── androidPrivacy.json
│   ├── App.vue
│   ├── index.html
│   ├── main.js
│   ├── manifest.json
│   ├── package.json
│   ├── pages.json
│   ├── tsconfig.json
│   ├── uni.promisify.adaptor.js
│   └── uni.scss
├── doc/
│   └── img/
│       ├── 1.png
│       ├── 10.png
│       ├── 11.png
│       ├── 12.png
│       ├── 13.png
│       ├── 14.png
│       ├── 15.png
│       ├── 16.png
│       ├── 2.png
│       ├── 3.png
│       ├── 4.png
│       ├── 5.png
│       ├── 6.png
│       ├── 7.png
│       ├── 8.png
│       ├── 9.png
│       └── pay.png
├── docker/
│   ├── app/  ← 应用入口
│   │   ├── Configuration/
│   │   │   ├── App.json
│   │   │   └── Database.json
│   │   └── wait-for-it.sh
│   ├── mysql/
│   │   └── mysql.cnf
│   ├── nginx/
│   │   ├── conf/
│   │   │   └── nginx.conf
│   │   └── key/
│   │       ├── abc.admin.com.crt
│   │       ├── abc.admin.com.csr
│   │       ├── abc.admin.com.key
│   │       ├── abc.admin.com.pem
│   │       ├── admin.com.crt
│   │       ├── admin.com.key
│   │       ├── admin.com.pem
│   │       └── ssl.sh
│   ├── build.sh
│   ├── docker-compose-builder.yml
│   ├── docker-compose.yml
│   └── README.md
├── docx/
│   ├── 企业管理_功能设计_V1.0/
│   │   ├── images/
│   │   │   ├── image1.png
│   │   │   ├── image14.png
│   │   │   ├── image15.png
│   │   │   ├── image16.png
│   │   │   ├── image17.png
│   │   │   ├── image18.png
│   │   │   ├── image19.png
│   │   │   ├── image2.png
│   │   │   ├── image20.png
│   │   │   ├── image21.png
│   │   │   ├── image22.png
│   │   │   ├── image23.png
│   │   │   ├── image24.png
│   │   │   ├── image25.png
│   │   │   ├── image26.png
│   │   │   ├── image27.png
│   │   │   ├── image28.png
│   │   │   └── image3.png
│   │   └── 企业管理_功能设计_V1.0.md
│   ├── 供应链主数据_功能设计_V1.0/
│   │   ├── images/
│   │   │   ├── image1.png
│   │   │   ├── image14.png
│   │   │   ├── image15.png
│   │   │   ├── image16.png
│   │   │   ├── image17.png
│   │   │   ├── image18.png
│   │   │   ├── image19.png
│   │   │   ├── image2.png
│   │   │   ├── image20.png
│   │   │   ├── image21.png
│   │   │   └── image3.png
│   │   └── 供应链主数据_功能设计_V1.0.md
│   ├── 数据权限_功能设计_V1.0/
│   │   ├── images/
│   │   │   ├── image14.png
│   │   │   ├── image15.png
│   │   │   ├── image16.png
│   │   │   ├── image17.png
│   │   │   ├── image18.png
│   │   │   ├── image19.png
│   │   │   ├── image20.png
│   │   │   ├── image21.png
│   │   │   ├── image22.png
│   │   │   ├── image23.png
│   │   │   └── image24.png
│   │   └── 数据权限_功能设计_V1.0.md
│   ├── 物料主数据_功能设计_V1.0/
│   │   ├── images/
│   │   │   ├── image14.png
│   │   │   ├── image15.png
│   │   │   ├── image16.png
│   │   │   ├── image17.png
│   │   │   ├── image18.png
│   │   │   ├── image19.png
│   │   │   ├── image20.png
│   │   │   ├── image21.png
│   │   │   ├── image22.png
│   │   │   ├── image23.png
│   │   │   ├── image24.png
│   │   │   ├── image25.png
│   │   │   ├── image26.png
│   │   │   ├── image27.png
│   │   │   ├── image28.png
│   │   │   ├── image29.png
│   │   │   └── image30.png
│   │   └── 物料主数据_功能设计_V1.0.md
│   └── 设备主数据_功能设计_V1.0/
│       ├── images/
│       │   ├── image1.png
│       │   ├── image14.png
│       │   ├── image15.png
│       │   ├── image16.png
│       │   ├── image17.png
│       │   ├── image18.png
│       │   ├── image19.png
│       │   ├── image2.png
│       │   ├── image20.png
│       │   ├── image21.png
│       │   ├── image22.png
│       │   └── image3.png
│       └── 设备主数据_功能设计_V1.0.md
├── feature-workflow/
│   ├── templates/  ← 模板
│   │   ├── checklist.md
│   │   ├── project-context.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── config.yaml
│   └── queue.yaml
├── features/
│   ├── active-mod-permission/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── archive/
│   │   └── archive-log.yaml
│   ├── P74-feat-user-permission/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P75-feat-permission-group/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P75-mod-supply-chain/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P79-feat-supplier/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P80-feat-customer/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P80-mod-equipment/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P83-feat-equipment-ledger/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P84-feat-equipment-model/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P85-feat-equipment-type/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P85-mod-material/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P86-feat-inspection-exemption/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P87-feat-material-info/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P88-feat-material-category/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P89-feat-uom-conversion/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P90-feat-uom/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P90-mod-enterprise/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P91-feat-shift-schedule/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── P92-feat-department-user/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   └── ... (10 more)
├── GoView/
│   ├── plop/
│   │   ├── store-template/
│   │   │   ├── index.d.hbs
│   │   │   ├── index.hbs
│   │   │   └── prompt.js
│   │   └── plopfile.js
│   ├── public/  ← 静态资源
│   │   └── favicon.ico
│   ├── src/  ← 源码根目录
│   │   ├── api/  ← API 定义
│   │   │   ├── mock/
│   │   │   ├── path/
│   │   │   ├── axios.config.ts
│   │   │   ├── axios.ts
│   │   │   └── http.ts
│   │   ├── assets/  ← 资源文件
│   │   │   ├── images/
│   │   │   ├── videos/
│   │   │   └── logo.png
│   │   ├── components/  ← UI 组件
│   │   │   ├── GoAppProvider/
│   │   │   ├── GoIconify/
│   │   │   ├── GoLangSelect/
│   │   │   ├── GoLoading/
│   │   │   ├── GoReload/
│   │   │   ├── GoSkeleton/
│   │   │   ├── GoSystemInfo/
│   │   │   ├── GoSystemSet/
│   │   │   ├── GoThemeSelect/
│   │   │   ├── GoUserInfo/
│   │   │   ├── GoVChart/
│   │   │   ├── I18n/
│   │   │   ├── Pages/
│   │   │   ├── Plugins/
│   │   │   └── Tips/
│   │   ├── directives/
│   │   │   └── index.ts
│   │   ├── enums/
│   │   │   ├── editPageEnum.ts
│   │   │   ├── eventEnum.ts
│   │   │   ├── fileTypeEnum.ts
│   │   │   ├── httpEnum.ts
│   │   │   ├── pageEnum.ts
│   │   │   ├── pluginEnum.ts
│   │   │   ├── storageEnum.ts
│   │   │   └── styleEnum.ts
│   │   ├── hooks/
│   │   │   ├── index.ts
│   │   │   ├── useCanvasInitOptions.hook.ts
│   │   │   ├── useChartDataFetch.hook.ts
│   │   │   ├── useChartDataPondFetch.hook.ts
│   │   │   ├── useChartInteract.hook.ts
│   │   │   ├── useCode.hook.ts
│   │   │   ├── useLang.hook.ts
│   │   │   ├── useLifeHandler.hook.ts
│   │   │   ├── usePreviewScale.hook.ts
│   │   │   ├── useSystemInit.hook.ts
│   │   │   ├── useTheme.hook.ts
│   │   │   └── useVCharts.hook.ts
│   │   ├── i18n/
│   │   │   ├── en/
│   │   │   ├── zh/
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── components/  ← UI 组件
│   │   │   ├── index.vue
│   │   │   └── parentLayout.vue
│   │   ├── packages/
│   │   │   ├── chartConfiguration/
│   │   │   ├── components/  ← UI 组件
│   │   │   ├── public/  ← 静态资源
│   │   │   ├── index.d.ts
│   │   │   └── index.ts
│   │   ├── plugins/
│   │   │   ├── customComponents.ts
│   │   │   ├── directives.ts
│   │   │   ├── icon.ts
│   │   │   ├── index.ts
│   │   │   ├── initFunction.ts
│   │   │   └── naive.ts
│   │   ├── router/
│   │   │   ├── modules/
│   │   │   ├── base.ts
│   │   │   ├── constant.ts
│   │   │   ├── index.ts
│   │   │   ├── router-guards.ts
│   │   │   └── types.ts
│   │   ├── settings/
│   │   │   ├── animations/
│   │   │   ├── chartThemes/
│   │   │   ├── vchartThemes/
│   │   │   ├── designColor.json
│   │   │   ├── designColorRecommend.json
│   │   │   ├── designSetting.ts
│   │   │   ├── httpSetting.ts
│   │   │   ├── pathConst.ts
│   │   │   └── systemSetting.ts
│   │   ├── store/
│   │   │   ├── modules/
│   │   │   └── index.ts
│   │   ├── styles/
│   │   │   ├── common/
│   │   │   └── pages/  ← 页面
│   │   ├── utils/  ← 工具函数
│   │   │   ├── components.ts
│   │   │   ├── crypto.ts
│   │   │   ├── file.ts
│   │   │   ├── http.ts
│   │   │   ├── index.ts
│   │   │   ├── plugin.ts
│   │   │   ├── router.ts
│   │   │   ├── storage.ts
│   │   │   ├── style.ts
│   │   │   ├── type.ts
│   │   │   └── utils.ts
│   │   ├── views/  ← 视图
│   │   │   ├── chart/
│   │   │   ├── edit/
│   │   │   ├── exception/
│   │   │   ├── login/
│   │   │   ├── preview/
│   │   │   ├── project/
│   │   │   └── redirect/
│   │   ├── App.vue
│   │   └── main.ts
│   ├── types/
│   │   ├── global.d.ts
│   │   ├── shims-vue.d.ts
│   │   └── vite-env.d.ts
│   ├── index.css
│   ├── index.html
│   ├── LICENSE
│   ├── Makefile
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── prettier.config.js
│   ├── README.md
│   ├── tsconfig.json
│   └── vite.config.ts
├── Web/
│   ├── api_build/
│   │   ├── build_api.sh
│   │   ├── build.bat
│   │   ├── build.sh
│   │   └── readme.md
│   ├── lang/
│   │   ├── index.js
│   │   └── index.json
│   ├── public/  ← 静态资源
│   │   ├── config.js
│   │   ├── favicon.ico
│   │   └── print-lock.css
│   ├── script/
│   │   ├── build-api.js
│   │   ├── clean-dist.js
│   │   ├── clean-lock.js
│   │   ├── clean-modules.js
│   │   ├── gen-ele-icon-types.js
│   │   ├── publish.js
│   │   └── translate.cjs
│   ├── src/  ← 源码根目录
│   │   ├── api/  ← API 定义
│   │   │   ├── base/
│   │   │   ├── login/
│   │   │   ├── menu/
│   │   │   └── system/
│   │   ├── api-services/
│   │   │   ├── aiChat/
│   │   │   ├── dataApproval/
│   │   │   ├── dingTalk/
│   │   │   ├── goView/
│   │   │   ├── paddleOCR/
│   │   │   └── system/
│   │   ├── assets/  ← 资源文件
│   │   │   ├── img/
│   │   │   ├── 401.png
│   │   │   ├── 404.png
│   │   │   ├── bg.svg
│   │   │   ├── chat.png
│   │   │   ├── lockscreen.img
│   │   │   ├── login-icon-two.svg
│   │   │   ├── login-icon-two1.svg
│   │   │   ├── login-icon-two2.svg
│   │   │   ├── logo-mini.svg
│   │   │   └── logo.png
│   │   ├── components/  ← UI 组件
│   │   │   ├── auth/
│   │   │   ├── avatar/
│   │   │   ├── badgeTabs/
│   │   │   ├── cameraDialog/
│   │   │   ├── cropper/
│   │   │   ├── dragVerify/
│   │   │   ├── editor/
│   │   │   ├── highLightKeyword/
│   │   │   ├── iconSelector/
│   │   │   ├── importButton/
│   │   │   ├── jsonEditor/
│   │   │   ├── mdEditor/
│   │   │   ├── noticeBar/
│   │   │   ├── numberRange/
│   │   │   ├── scEcharts/
│   │   │   ├── selector/
│   │   │   ├── svgIcon/
│   │   │   ├── sysDict/
│   │   │   ├── table/
│   │   │   ├── transfer/
│   │   │   └── ... (1 more)
│   │   ├── directive/
│   │   │   ├── authDirective.ts
│   │   │   ├── customDirective.ts
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── dateTimeShortCust.ts
│   │   │   ├── setupVXETableHook.ts
│   │   │   └── useVxeTableOptionsHook.ts
│   │   ├── i18n/
│   │   │   ├── lang/
│   │   │   ├── menu/
│   │   │   ├── pages/  ← 页面
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── component/
│   │   │   ├── footer/
│   │   │   ├── lockScreen/
│   │   │   ├── logo/
│   │   │   ├── main/
│   │   │   ├── navBars/
│   │   │   ├── navMenu/
│   │   │   ├── routerView/
│   │   │   ├── sponsors/
│   │   │   ├── upgrade/
│   │   │   └── index.vue
│   │   ├── router/
│   │   │   ├── backEnd.ts
│   │   │   ├── frontEnd.ts
│   │   │   ├── index.ts
│   │   │   └── route.ts
│   │   ├── stores/
│   │   │   ├── index.ts
│   │   │   ├── keepAliveNames.ts
│   │   │   ├── requestOldRoutes.ts
│   │   │   ├── routesList.ts
│   │   │   ├── tagsViewRoutes.ts
│   │   │   ├── themeConfig.ts
│   │   │   └── userInfo.ts
│   │   ├── theme/
│   │   │   ├── common/
│   │   │   ├── font-awesome/
│   │   │   ├── iconfont/
│   │   │   ├── media/
│   │   │   ├── mixins/
│   │   │   ├── app.scss
│   │   │   ├── dark.scss
│   │   │   ├── element.scss
│   │   │   ├── iconSelector.scss
│   │   │   ├── index.scss
│   │   │   ├── loading.scss
│   │   │   ├── other.scss
│   │   │   ├── tableImage.scss
│   │   │   ├── tableTool.scss
│   │   │   ├── vxeTable.scss
│   │   │   └── waves.scss
│   │   ├── types/
│   │   │   ├── axios.d.ts
│   │   │   ├── ele-icons.d.ts
│   │   │   ├── franc.d.ts
│   │   │   ├── global.d.ts
│   │   │   ├── layout.d.ts
│   │   │   ├── mitt.d.ts
│   │   │   ├── pinia.d.ts
│   │   │   └── views.d.ts
│   │   ├── utils/  ← 工具函数
│   │   │   ├── arrayOperation.ts
│   │   │   ├── authFunction.ts
│   │   │   ├── auto-update.ts
│   │   │   ├── axios-utils.ts
│   │   │   ├── base64Conver.ts
│   │   │   ├── build.ts
│   │   │   ├── calendar.js
│   │   │   ├── commonFunction.ts
│   │   │   ├── data-signature.ts
│   │   │   ├── download.ts
│   │   │   ├── exportExcel.ts
│   │   │   ├── flowLoading.ts
│   │   │   ├── formatTime.ts
│   │   │   ├── formRule.ts
│   │   │   ├── formValidate.ts
│   │   │   ├── getStyleSheets.ts
│   │   │   ├── gpsConvertor.ts
│   │   │   ├── idleTimeout.ts
│   │   │   ├── json-utils.ts
│   │   │   ├── loading.ts
│   │   │   └── ... (12 more)
│   │   ├── views/  ← 视图
│   │   │   ├── about/
│   │   │   ├── aiChat/
│   │   │   ├── dataApproval/
│   │   │   ├── error/
│   │   │   ├── home/
│   │   │   ├── login/
│   │   │   ├── mqttx/
│   │   │   └── system/
│   │   ├── App.vue
│   │   └── main.ts
│   ├── CHANGELOG.md
│   ├── eslint.config.mjs
│   ├── index.html
│   ├── LICENSE
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── README.md
│   ├── tsconfig.json
│   └── vite.config.ts
├── CLAUDE.md
├── DISCLAIMER.md
├── L Mes.xmind
├── LICENSE-APACHE
├── LICENSE-MIT
├── project-context.md
├── README.md
└── 一键净化项目.bat
```

***

*由 edith-document-project 生成*

⠀