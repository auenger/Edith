# Tasks: feat-p2-multimodal-ingestion

## Task Breakdown

### 1. 配置模型扩展
- [ ] 在 `agent/src/config.ts` 新增 `MultimodalConfig` 接口
- [ ] 新增 `IngestionConfig` 和 `MarkItDownConfig` 接口
- [ ] 更新 `EdithConfig` 接口，添加 multimodal 和 ingestion 字段
- [ ] 更新 edith.yaml 配置校验逻辑，确保向后兼容

### 2. MarkItDown 集成
- [ ] 将 MarkItDown Python 包封装为 edith_scan 的子模块
- [ ] 实现格式检测路由：根据文件扩展名选择处理管道
- [ ] 实现 PDF 摄入管道（MarkItDown + OCR）
- [ ] 实现 Office 摄入管道（Word/Excel/PPT）
- [ ] 实现图片摄入管道（LLM Vision 语义描述）

### 3. 多模态模型接入
- [ ] 支持 OpenAI Vision 模型（gpt-4o）
- [ ] 支持 Anthropic Vision 模型
- [ ] 支持本地部署 Vision（Ollama / vLLM）
- [ ] OCR 插件集成（Azure / Tesseract）

### 4. edith_scan 扩展
- [ ] 在 edith_scan 工具中添加多模态摄入路由
- [ ] 处理结果统一进入蒸馏管道
- [ ] 错误处理：不支持的格式优雅跳过

### 5. 集成测试
- [ ] PDF 摄入 E2E 测试
- [ ] Office 文档摄入测试
- [ ] 图片 LLM Vision 摄入测试
- [ ] 配置兼容性测试

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 初始拆分 |
