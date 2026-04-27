# Checklist: feat-packaging

## Completion Checklist

### Research 前置
- [ ] pi SDK `pi package` 机制已调研完毕
- [ ] pi-package.yaml schema 已确认
- [ ] pi SDK `pi install` 机制已调研完毕
- [ ] post-install 钩子支持情况已确认
- [ ] Pi Package 与 npm 共存方案已确认
- [ ] spec.md Research Required 段落已更新为调研结论

### 配置文件
- [ ] pi-package.yaml 已创建且字段完整
- [ ] package.json bin 字段已注册 `jarvis` 命令
- [ ] package.json scripts.postinstall 已配置
- [ ] package.json files 白名单已配置
- [ ] CHANGELOG.md 已创建，包含初始版本
- [ ] pi-package.yaml 和 package.json 版本号一致

### CLI 入口
- [ ] bin/jarvis.ts 已创建
- [ ] `jarvis --version` 正常输出版本号
- [ ] `jarvis --init` 交互式向导正常工作
- [ ] `jarvis`（无参数）检测 jarvis.yaml 并正确分支
- [ ] 无 jarvis.yaml 时不自动创建，给出引导提示
- [ ] 有 jarvis.yaml 时正常启动 Agent

### 安装后脚本
- [ ] scripts/post-install.ts 已创建
- [ ] jarvis.yaml 存在时输出正确提示
- [ ] jarvis.yaml 不存在时输出正确引导
- [ ] templates/jarvis.yaml.template 已创建且包含注释

### 打包验证
- [ ] TypeScript 编译无错误
- [ ] `pi package` 生成有效 Package
- [ ] Package 包含 Extension 入口
- [ ] Package 包含 3 个 Skills
- [ ] Package 包含配置模板
- [ ] Package 包含 System Prompt 模板

### Scenario 验证
- [ ] Scenario 1: Pi Package 打包成功
- [ ] Scenario 2: pi install 安装成功
- [ ] Scenario 3: 无 pi CLI 时错误提示清晰
- [ ] Scenario 4: 首次运行无配置 → 引导初始化
- [ ] Scenario 5: 首次运行有配置 → 正常启动
- [ ] Scenario 6: `jarvis --version` 版本号正确
- [ ] Scenario 7: 升级保留配置和知识产物
- [ ] Scenario 8: `jarvis --init` 向导流程正确

### JARVIS Discipline
- [ ] Skills 代码不暴露给用户（编译后打包）
- [ ] 配置优于代码（jarvis.yaml.template 引导用户配置）
- [ ] pi SDK 不 fork（使用标准打包机制）
- [ ] 版本号遵循 semver
- [ ] 不假装 Mature（v0.1.0 标注为 pilot 阶段）
