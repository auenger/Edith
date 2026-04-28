# Tasks: feat-tui-layout

## Task Breakdown
### 1. 修复 Markdown `[object Object]` 渲染
- [x] 修复 `MarkdownRenderer.tsx:85` heading 渲染：字符串拼接 → JSX children
- [x] 修复 `MarkdownRenderer.tsx:152` table header 渲染
- [x] 检查其他 `renderInline` 调用点是否有同类问题
- [x] 验证标题、表格、列表正确渲染

### 2. 修复消息渲染位置（布局）
- [x] 移除 `Static` 组件，改用标准 Box 渲染所有消息
- [x] 实现消息列表的窗口化渲染（MAX_VISIBLE_MESSAGES=100）
- [x] 确保 Banner 固定顶部、InputArea 固定底部
- [x] 确认思考过程和 tool 调用在中间内容区域渲染

### 3. 实现思考过程指示器
- [x] 创建 `ThinkingIndicator.tsx` 组件（状态文本 + 时间 + tokens + 动画）
- [x] 集成到 InputArea 上方
- [x] 添加持续时间计时器（使用 useEffect + setInterval）
- [x] 显示 token 输出计数
- [x] 状态切换：Thinking… / Running tools… / Generating…

### 4. 布局稳定性验证
- [x] 多轮对话（5+ 轮）布局测试
- [x] 长消息内容测试
- [x] 流式输出期间布局测试
- [x] Markdown 各种元素渲染测试

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | 新增 Markdown 修复 + 思考指示器，Size 升级为 M |
| 2026-04-28 | Implementation complete | 4/4 tasks done, TypeScript 编译通过 |
