import React from "react";
import { Box, Static, Text } from "ink";
import type { Message, ThinkingBlock as ThinkingBlockType } from "./types.js";
import { ThinkingBlock } from "./ThinkingBlock.js";

interface ContentAreaProps {
  messages: Message[];
  thinkingBlocks: ThinkingBlockType[];
  onToggleThinking: (id: string) => void;
}

function MessageItem({ message }: { message: Message }) {
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
    <Text>
      <Text color="green">{"EDITH"}</Text>
      {": "}
      {message.content}
      {message.status === "streaming" && <Text color="gray">▌</Text>}
    </Text>
  );
}

export function ContentArea({ messages, thinkingBlocks, onToggleThinking }: ContentAreaProps) {
  const completedMessages = messages.filter(
    (m, i) => m.status === "complete" && i < messages.length - 1
  );
  const liveMessages = messages.filter(
    (m, i) => m.status === "streaming" || i === messages.length - 1
  );

  const hasThinkingBlocks = thinkingBlocks.length > 0;
  const lastBlock = thinkingBlocks[thinkingBlocks.length - 1];
  const isActivelyThinking = lastBlock?.isStreaming === true;
  const completedThinkingBlocks = hasThinkingBlocks
    ? thinkingBlocks.slice(0, isActivelyThinking ? -1 : undefined)
    : [];
  const activeThinkingBlock = isActivelyThinking ? lastBlock : null;

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {completedMessages.length > 0 && (
        <Static items={completedMessages}>
          {(msg) => <MessageItem key={msg.id} message={msg} />}
        </Static>
      )}

      {/* Completed thinking blocks */}
      {completedThinkingBlocks.map((tb) => (
        <ThinkingBlock key={tb.id} block={tb} onToggle={onToggleThinking} />
      ))}

      {/* Active (streaming) thinking block */}
      {activeThinkingBlock && (
        <ThinkingBlock block={activeThinkingBlock} onToggle={onToggleThinking} />
      )}

      {liveMessages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      {messages.length === 0 && !hasThinkingBlocks && (
        <Text dimColor>Agent is ready. Type your message below.</Text>
      )}
    </Box>
  );
}
