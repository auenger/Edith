import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { ToolCallInfo } from "./types.js";

interface ToolCallIndicatorProps {
  toolCalls: ToolCallInfo[];
}

export function ToolCallIndicator({ toolCalls }: ToolCallIndicatorProps) {
  if (toolCalls.length === 0) return null;

  return (
    <Box flexDirection="column" marginLeft={2} marginY={1}>
      {toolCalls.map((tc) => (
        <ToolCallItem key={tc.toolCallId} toolCall={tc} />
      ))}
    </Box>
  );
}

function ToolCallItem({ toolCall }: { toolCall: ToolCallInfo }) {
  if (toolCall.status === "running") {
    return (
      <Box>
        <Text color="yellow">
          <Spinner type="dots" />
        </Text>
        <Text color="yellow"> {toolCall.toolName} 执行中...</Text>
      </Box>
    );
  }

  if (toolCall.status === "complete") {
    return (
      <Box>
        <Text color="green">✓ </Text>
        <Text bold>{toolCall.toolName}</Text>
        {toolCall.summary && <Text color="gray"> — {toolCall.summary}</Text>}
      </Box>
    );
  }

  // error
  return (
    <Box>
      <Text color="red">✗ </Text>
      <Text bold color="red">{toolCall.toolName}</Text>
      {toolCall.summary && <Text color="red"> — {toolCall.summary}</Text>}
    </Box>
  );
}
