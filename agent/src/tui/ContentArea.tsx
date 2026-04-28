import React from "react";
import { Box, Static, Text } from "ink";
import type { Message, MessageRole } from "./types.js";

interface ContentAreaProps {
  messages: Message[];
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

export function ContentArea({ messages }: ContentAreaProps) {
  // Split: completed messages go to Static (scroll up naturally),
  // streaming/last message stays in live area (keeps input visible).
  const completedMessages = messages.filter(
    (m, i) => m.status === "complete" && i < messages.length - 1
  );
  const liveMessages = messages.filter(
    (m, i) => m.status === "streaming" || i === messages.length - 1
  );

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {completedMessages.length > 0 && (
        <Static items={completedMessages}>
          {(msg) => <MessageItem key={msg.id} message={msg} />}
        </Static>
      )}
      {liveMessages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      {messages.length === 0 && (
        <Text dimColor>Agent is ready. Type your message below.</Text>
      )}
    </Box>
  );
}
