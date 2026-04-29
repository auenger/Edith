import React from "react";
import { Box, Text } from "ink";
import type { ThinkingBlock as ThinkingBlockType } from "./types.js";

interface ThinkingBlockProps {
  block: ThinkingBlockType;
  onToggle: (id: string) => void;
}

const MAX_VISIBLE_LINES = 5;

export function ThinkingBlock({ block, onToggle }: ThinkingBlockProps) {
  if (!block.content) return null;

  const lines = block.content.split("\n");
  const lineCount = lines.length;
  const truncated = lineCount > MAX_VISIBLE_LINES + 1;
  const visibleLines = truncated ? lines.slice(0, MAX_VISIBLE_LINES) : lines;

  return (
    <Box flexDirection="column" marginLeft={2}>
      <Text dimColor>
        {"  "}💭 {block.isStreaming ? "analyzing..." : `${lineCount} lines`}
        {truncated && <Text color="gray"> {" [T] collapse"}</Text>}
      </Text>
      {visibleLines.map((line, i) => (
        <Text key={i} dimColor>
          {"  "}{line || " "}
        </Text>
      ))}
      {truncated && (
        <Text color="gray">{"  "}... +{lineCount - MAX_VISIBLE_LINES} more lines</Text>
      )}
    </Box>
  );
}
