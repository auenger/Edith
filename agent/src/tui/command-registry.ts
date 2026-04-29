export interface SlashCommand {
  name: string;
  description: string;
  type: "local" | "session" | "agent";
  aliases?: string[];
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { name: "context", description: "显示上下文统计信息", type: "local", aliases: ["ctx"] },
  { name: "model", description: "列出/切换 LLM Profile", type: "local" },
  { name: "status", description: "知识库状态总览", type: "local" },
  { name: "new", description: "新建会话（清除所有上下文）", type: "session" },
  { name: "clear", description: "清除上下文（保留 system prompt）", type: "session" },
  { name: "compact", description: "压缩上下文（摘要历史）", type: "session" },
  { name: "explore", description: "快速浏览项目结构", type: "agent" },
  { name: "delegate", description: "委派任务给子代理", type: "agent" },
  { name: "init", description: "初始化 EDITH 工作区", type: "agent" },
];

export function findCommand(input: string): SlashCommand | undefined {
  const raw = input.startsWith("/") ? input.slice(1) : input;
  const name = raw.split(/\s/)[0];
  return SLASH_COMMANDS.find(
    (cmd) => cmd.name === name || cmd.aliases?.includes(name)
  );
}

export function filterCommands(query: string): SlashCommand[] {
  if (!query) return SLASH_COMMANDS;
  const q = query.toLowerCase();
  return SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.name.toLowerCase().startsWith(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.aliases?.some((a) => a.toLowerCase().startsWith(q))
  );
}
