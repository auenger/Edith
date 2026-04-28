import React, { useCallback } from "react";
import { Box, Text, useInput } from "ink";
import type { ThinkingBlock as ThinkingBlockType } from "./types.js";

interface ThinkingBlockProps {
  block: ThinkingBlockType;
  onToggle: (id: string) => void;
}

function ThinkingSummary({ block, onToggle }: ThinkingBlockProps) {
  const lineCount = block.content.split("\n").length;
  const runningTools = block.toolCalls.filter((tc) => tc.status === "running");
  const completedTools = block.toolCalls.filter((tc) => tc.status === "complete");

  let statusText: string;
  if (block.isStreaming) {
    if (runningTools.length > 0) {
      statusText = `calling ${runningTools.map((t) => t.toolName).join(", ")}...`;
    } else {
      statusText = "analyzing...";
    }
  } else {
    if (completedTools.length > 0) {
      statusText = `${completedTools.length} tool${completedTools.length > 1 ? "s" : ""} used`;
    } else {
      statusText = `${lineCount} line${lineCount > 1 ? "s" : ""}`;
    }
  }

  return (
    <Box>
      <Text dimColor>
        {"  "}💭 {statusText}
      </Text>
      <Text color="gray"> {" [T] expand"}</Text>
    </Box>
  );
}

function ThinkingDetail({ block, onToggle }: ThinkingBlockProps) {
  const runningTools = block.toolCalls.filter((tc) => tc.status === "running");
  const completedTools = block.toolCalls.filter((tc) => tc.status === "complete");

  return (
    <Box flexDirection="column" marginLeft={2}>
      <Text color="gray">{"─".repeat(40)}</Text>
      {block.content.split("\n").map((line, i) => (
        <Text key={i} dimColor>
          {line || " "}
        </Text>
      ))}
      {block.toolCalls.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {completedTools.map((tc) => (
            <Box key={tc.toolCallId}>
              <Text color="green">✓ </Text>
              <Text dimColor>{tc.toolName}</Text>
              {tc.summary && <Text color="gray">: {tc.summary}</Text>}
            </Box>
          ))}
          {runningTools.map((tc) => (
            <Box key={tc.toolCallId}>
              <Text color="yellow">◌ </Text>
              <Text dimColor>{tc.toolName}...</Text>
            </Box>
          ))}
        </Box>
      )}
      <Text color="gray">{"─".repeat(40)}</Text>
      <Text color="gray">{"  "}[T] collapse</Text>
    </Box>
  );
}

export function ThinkingBlock({ block, onToggle }: ThinkingBlockProps) {
  if (!block.content && block.toolCalls.length === 0) return null;

  if (block.expanded) {
    return <ThinkingDetail block={block} onToggle={onToggle} />;
  }

  return <ThinkingSummary block={block} onToggle={onToggle} />;
}
