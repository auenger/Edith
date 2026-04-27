# Tasks: feat-packaging

## Task Breakdown

### Phase 0: Research (前置研究)

- [ ] T0.1 阅读 pi SDK 文档：`pi package --help`，了解完整参数和产出格式
- [ ] T0.2 阅读 pi SDK 文档：`pi install --help`，了解安装机制和目标路径
- [ ] T0.3 查阅 pi-package.yaml 的完整配置 schema（必需字段、可选字段）
- [ ] T0.4 确认 Pi Package 的 post-install 钩子支持情况
- [ ] T0.5 确认 Pi Package 与 npm package 共存的可行性
- [ ] T0.6 在 spec.md 中记录调研结论（更新 Research Required 段落为调研结论）

### Phase 1: 配置文件 (Scenario 1, 6)

- [ ] T1.1 创建 `pi-package.yaml`：name、version、description、entry、extensions、skills、templates、post-install
- [ ] T1.2 更新 `package.json`：bin 字段注册 `jarvis` 命令、scripts.postinstall、files 白名单
- [ ] T1.3 创建 `CHANGELOG.md`：初始版本 0.1.0 条目
- [ ] T1.4 验证 pi-package.yaml 和 package.json 中版本号一致

### Phase 2: CLI 入口 (Scenario 4, 5, 6, 8)

- [ ] T2.1 创建 `bin/jarvis.ts`：解析命令行参数
- [ ] T2.2 实现 `--version` 命令：读取 package.json version 并输出
- [ ] T2.3 实现 `--init` 命令：交互式初始化向导（LLM provider、workspace、repos）
- [ ] T2.4 实现默认启动：检测 jarvis.yaml 是否存在
  - 存在 → 加载配置，启动 Agent
  - 不存在 → 提示运行 `jarvis --init`，不自动创建
- [ ] T2.5 测试 Scenario 4：无 jarvis.yaml 时执行 `jarvis`，验证引导提示
- [ ] T2.6 测试 Scenario 5：有 jarvis.yaml 时执行 `jarvis`，验证正常启动
- [ ] T2.7 测试 Scenario 6：执行 `jarvis --version`，验证版本号输出
- [ ] T2.8 测试 Scenario 8：执行 `jarvis --init`，验证向导流程和配置生成

### Phase 3: 安装后脚本 (Scenario 2, 3)

- [ ] T3.1 创建 `scripts/post-install.ts`：检测 jarvis.yaml 存在性
- [ ] T3.2 实现逻辑：存在 → 输出 "检测到已有配置"；不存在 → 输出 "运行 jarvis --init"
- [ ] T3.3 创建 `templates/jarvis.yaml.template`：包含所有可配置字段和注释说明
- [ ] T3.4 测试 Scenario 2：在已安装 pi CLI 的环境执行 `pi install jarvis`，验证安装成功
- [ ] T3.5 测试 Scenario 3：模拟无 pi CLI 环境，验证错误提示清晰

### Phase 4: 打包验证 (Scenario 1)

- [ ] T4.1 确认 TypeScript 编译通过（src/ → dist/）
- [ ] T4.2 执行 `pi package`，验证生成有效 Package
- [ ] T4.3 解包验证 Package 内容：Extension、3 个 Skills、模板、System Prompt、配置文件
- [ ] T4.4 测试 Scenario 1：完整打包流程验证

### Phase 5: 升级验证 (Scenario 7)

- [ ] T5.1 模拟已安装 v0.1.0 状态（jarvis.yaml + 知识产物）
- [ ] T5.2 执行升级到 v0.2.0
- [ ] T5.3 验证 jarvis.yaml 配置保持不变
- [ ] T5.4 验证知识产物保持不变
- [ ] T5.5 验证 `jarvis --version` 输出 v0.2.0
- [ ] T5.6 测试 Scenario 7：升级保留配置验证

## Progress Log
| Date       | Progress          | Notes                                                                   |
|------------|-------------------|-------------------------------------------------------------------------|
| 2026-04-27 | Spec enriched     | 增加 OUT scope、Research Required 段落、6 个新 Scenario、详细文件结构和构建流程 |
