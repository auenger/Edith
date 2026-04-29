import React, { useMemo } from "react";
import { Box, Text } from "ink";
import type { Message, ThinkingBlock as ThinkingBlockType, ToolCallBlock as ToolCallBlockType, DisplayItem } from "./types.js";
import { ThinkingBlock } from "./ThinkingBlock.js";
import { ToolCallBlockItem } from "./ToolCallBlock.js";
import { MarkdownRenderer } from "./MarkdownRenderer.js";

interface ContentAreaProps {
  messages: Message[];
  thinkingBlocks: ThinkingBlockType[];
  toolCallBlocks: ToolCallBlockType[];
  onToggleThinking: (id: string) => void;
}

function hasMarkdown(content: string): boolean {
  return /[`#*_\[\]]/m.test(content);
}

const MAX_VISIBLE_ITEMS = 120;

const MessageItem = React.memo(function MessageItem({ message }: { message: Message }) {
  if (message.role === "system") {
    return <Text dimColor>{message.content}</Text>;
  }

  if (message.role === "user") {
    return (
      <Text>
        <Text color="cyan">{"你"}</Text>
        {": "}
        {message.content}
      </Text>
    );
  }

  return (
    <Box flexDirection="column">
      <Text>
        <Text color="green">{"EDITH"}</Text>
        {":"}
      </Text>
      {hasMarkdown(message.content) ? (
        <MarkdownRenderer content={message.content} />
      ) : (
        <Text>{"  "}{message.content}</Text>
      )}
      {message.status === "streaming" && <Text color="gray">{"  "}▌</Text>}
    </Box>
  );
});

export function ContentArea({ messages, thinkingBlocks, toolCallBlocks, onToggleThinking }: ContentAreaProps) {
  const displayItems = useMemo<DisplayItem[]>(() => {
    const items: DisplayItem[] = [
      ...messages.map((m) => ({ kind: "message" as const, data: m })),
      ...thinkingBlocks.map((tb) => ({ kind: "thinking" as const, data: tb })),
      ...toolCallBlocks.map((tc) => ({ kind: "toolCall" as const, data: tc })),
    ];

    items.sort((a, b) => {
      const ta = "timestamp" in a.data ? (a.data as any).timestamp : 0;
      const tb2 = "timestamp" in b.data ? (b.data as any).timestamp : 0;
      return ta - tb2;
    });

    if (items.length <= MAX_VISIBLE_ITEMS) return items;
    return items.slice(-MAX_VISIBLE_ITEMS);
  }, [messages, thinkingBlocks, toolCallBlocks]);

  const hasContent = displayItems.length > 0;

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1} overflowY="hidden">
      {displayItems.map((item, idx) => {
        switch (item.kind) {
          case "message":
            return (
              <Box key={`m-${item.data.id}`} marginBottom={1}>
                <MessageItem message={item.data} />
              </Box>
            );
          case "thinking":
            return (
              <Box key={`t-${item.data.id}`} marginBottom={1}>
                <ThinkingBlock block={item.data} onToggle={onToggleThinking} />
              </Box>
            );
          case "toolCall":
            return (
              <Box key={`tc-${item.data.id}`} marginBottom={1}>
                <ToolCallBlockItem block={item.data} />
              </Box>
            );
        }
      })}

      {!hasContent && (
        <Text dimColor>Agent is ready. Type your message below.</Text>
      )}
    </Box>
  );
}
