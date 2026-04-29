import React from "react";
import { Box, Text } from "ink";
import type { ThinkingBlock as ThinkingBlockType } from "./types.js";

interface ThinkingBlockProps {
  block: ThinkingBlockType;
  onToggle: (id: string) => void;
}

function ThinkingSummary({ block }: ThinkingBlockProps) {
  const lineCount = block.content.split("\n").length;
  const statusText = block.isStreaming
    ? "analyzing..."
    : `${lineCount} line${lineCount > 1 ? "s" : ""}`;

  return (
    <Box>
      <Text dimColor>
        {"  "}💭 {statusText}
      </Text>
      <Text color="gray"> {" [T] expand"}</Text>
    </Box>
  );
}

function ThinkingDetail({ block }: ThinkingBlockProps) {
  return (
    <Box flexDirection="column" marginLeft={2}>
      <Text color="gray">{"─".repeat(40)}</Text>
      {block.content.split("\n").map((line, i) => (
        <Text key={i} dimColor>
          {line || " "}
        </Text>
      ))}
      <Text color="gray">{"─".repeat(40)}</Text>
      <Text color="gray">{"  "}[T] collapse</Text>
    </Box>
  );
}

export function ThinkingBlock({ block, onToggle }: ThinkingBlockProps) {
  if (!block.content) return null;

  if (block.expanded) {
    return <ThinkingDetail block={block} onToggle={onToggle} />;
  }

  return <ThinkingSummary block={block} onToggle={onToggle} />;
}
