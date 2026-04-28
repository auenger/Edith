# Tasks: feat-packaging

## Task Breakdown

### Phase 0: Research (前置研究)

- [x] T0.1 阅读 pi SDK 文档：`pi package --help`，了解完整参数和产出格式
- [x] T0.2 阅读 pi SDK 文档：`pi install --help`，了解安装机制和目标路径
- [x] T0.3 查阅 pi-package.yaml 的完整配置 schema（必需字段、可选字段）
- [x] T0.4 确认 Pi Package 的 post-install 钩子支持情况
- [x] T0.5 确认 Pi Package 与 npm package 共存的可行性
- [x] T0.6 在 spec.md 中记录调研结论（更新 Research Required 段落为调研结论）

### Phase 1: 配置文件 (Scenario 1, 6)

- [x] T1.1 ~~创建 `pi-package.yaml`~~ -> 调研发现 pi-package.yaml 不存在于 pi SDK 中，使用标准 npm 打包替代
- [x] T1.2 更新 `package.json`：name=@edith/agent、bin 字段注册 `edith` 命令、scripts.postinstall、files 白名单
- [x] T1.3 创建 `CHANGELOG.md`：初始版本 0.1.0 条目
- [x] T1.4 验证 package.json 中版本号一致性（0.1.0）

### Phase 2: CLI 入口 (Scenario 4, 5, 6, 8)

- [x] T2.1 创建 `src/bin/edith.ts`：解析命令行参数
- [x] T2.2 实现 `--version` 命令：读取 package.json version 并输出 → 验证通过：`edith v0.1.0`
- [x] T2.3 实现 `--init` 命令：委托给 config.ts 的 initConfigWizard
- [x] T2.4 实现默认启动：检测 edith.yaml 是否存在
  - 存在 → 加载配置，启动 Agent
  - 不存在 → 提示运行 `edith --init`，不自动创建
- [x] T2.5 测试 Scenario 4：无 edith.yaml 时执行 `edith`，验证引导提示 ✓
- [x] T2.6 测试 Scenario 5：有 edith.yaml 时执行 `edith`，验证正常启动 ✓（委托给 agent-startup）
- [x] T2.7 测试 Scenario 6：执行 `edith --version`，验证版本号输出 ✓
- [x] T2.8 测试 Scenario 8：执行 `edith --init`，验证向导流程和配置生成 ✓（委托给 initConfigWizard）

### Phase 3: 安装后脚本 (Scenario 2, 3)

- [x] T3.1 创建 `src/scripts/post-install.ts`：检测 edith.yaml 存在性
- [x] T3.2 实现逻辑：存在 → 输出 "检测到已有配置"；不存在 → 输出 "运行 edith --init"
- [x] T3.3 创建 `templates/edith.yaml.template`：包含所有可配置字段和注释说明
- [x] T3.4 测试 Scenario 2：post-install 脚本在有配置时正确输出引导信息 ✓
- [x] T3.5 测试 Scenario 3：post-install 脚本在无配置时正确输出初始化提示 ✓

### Phase 4: 打包验证 (Scenario 1)

- [x] T4.1 确认 TypeScript 编译通过（src/ → dist/）✓
- [x] T4.2 执行 `tsc`，验证生成有效 dist/ 输出 ✓
- [x] T4.3 验证 dist/ 内容：bin/edith.js、scripts/post-install.js、agent-startup.js、index.js ✓
- [x] T4.4 测试 Scenario 1：完整编译流程验证 ✓

### Phase 5: 升级验证 (Scenario 7)

- [ ] T5.1 模拟已安装 v0.1.0 状态（edith.yaml + 知识产物）— 需实际 npm publish 后验证
- [ ] T5.2 执行升级到 v0.2.0 — 需实际 npm publish 后验证
- [ ] T5.3 验证 edith.yaml 配置保持不变 — 需实际升级后验证
- [ ] T5.4 验证知识产物保持不变 — 需实际升级后验证
- [ ] T5.5 验证 `edith --version` 输出 v0.2.0 — 需实际升级后验证
- [ ] T5.6 测试 Scenario 7：升级保留配置验证 — 需实际 npm publish 后验证

## Progress Log
| Date       | Progress          | Notes                                                                   |
|------------|-------------------|-------------------------------------------------------------------------|
| 2026-04-27 | Spec enriched     | 增加 OUT scope、Research Required 段落、6 个新 Scenario、详细文件结构和构建流程 |
| 2026-04-27 | Research done     | 发现 pi-package.yaml 不存在于 pi SDK，改用标准 npm 打包 + pi extension 自动发现 |
| 2026-04-27 | Implementation done | Phase 1-4 全部完成，TypeScript 编译通过，CLI/post-install 验证通过 |
