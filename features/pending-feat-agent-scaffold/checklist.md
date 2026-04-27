# Checklist: feat-agent-scaffold

## Completion Checklist

### 项目结构
- [ ] `agent/` 目录存在且包含 package.json / tsconfig.json / jarvis.yaml
- [ ] `agent/src/` 包含 index.ts / extension.ts / config.ts
- [ ] TypeScript strict 模式编译无错误

### pi SDK 集成
- [ ] `@mariozechner/pi-coding-agent` 可通过 npm install 安装
- [ ] `createAgent` 函数可用且签名正确
- [ ] Extension 骨架被 pi SDK 成功加载
- [ ] pi SDK API 签名已记录（registerTool / registerCommand / on）

### 配置解析
- [ ] jarvis.yaml 正确解析为 JarvisConfig TypeScript 对象
- [ ] 配置文件缺失时显示友好错误（非 crash）
- [ ] YAML 语法错误时显示含行号的错误信息

### 启动验证
- [ ] `npm install` 成功（退出码 0）
- [ ] `npm start` 成功启动 Agent（退出码 0）
- [ ] 终端显示欢迎信息
- [ ] Agent 进入交互式等待状态

### 错误处理
- [ ] 无 jarvis.yaml 时友好退出（非 uncaught exception）
- [ ] 无效 YAML 时友好退出（含行号信息）
- [ ] pi SDK 加载失败时明确报错

### 代码质量
- [ ] TypeScript strict 模式，无 any 类型
- [ ] 无 TODO/FIXME
- [ ] 无多余依赖

### JARVIS Discipline
- [ ] pi SDK 不 fork，仅作为 npm 依赖
- [ ] 不暴露 Skill 名称给用户
- [ ] 不编造不存在的代码事实
