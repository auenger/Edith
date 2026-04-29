import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { ToolCallBlock as ToolCallBlockType } from "./types.js";

const MAX_RESULT_LINES = 8;
const MAX_RESULT_LINE_WIDTH = 120;

function truncateLine(line: string): string {
  return line.length > MAX_RESULT_LINE_WIDTH
    ? line.slice(0, MAX_RESULT_LINE_WIDTH) + "..."
    : line;
}

function formatArgs(args: string): string {
  if (!args) return "";
  const truncated = args.length > 60 ? args.slice(0, 60) + "..." : args;
  return `(${truncated})`;
}

export const ToolCallBlockItem = React.memo(function ToolCallBlockItem({
  block,
}: {
  block: ToolCallBlockType;
}) {
  if (block.status === "running") {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color="blue">⏺ </Text>
          <Text color="yellow">
            <Spinner type="dots" />
          </Text>
          <Text bold> {block.toolName}</Text>
          <Text color="gray">{formatArgs(block.args)}</Text>
        </Box>
      </Box>
    );
  }

  const resultLines = block.result
    ? block.result.split("\n").filter((l) => l.trim())
    : [];

  if (block.status === "error") {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color="red">⏺ </Text>
          <Text bold color="red">{block.toolName}</Text>
          <Text color="gray">{formatArgs(block.args)}</Text>
        </Box>
        {resultLines.slice(0, MAX_RESULT_LINES).map((line, i) => (
          <Text key={i} color="red">
            {"  "}⎿ {truncateLine(line)}
          </Text>
        ))}
      </Box>
    );
  }

  // complete
  return (
    <Box flexDirection="column">
      <Box>
        <Text color="blue">⏺ </Text>
        <Text bold>{block.toolName}</Text>
        <Text color="gray">{formatArgs(block.args)}</Text>
      </Box>
      {resultLines.slice(0, MAX_RESULT_LINES).map((line, i) => (
        <Text key={i} dimColor>
          {"  "}⎿ {truncateLine(line)}
        </Text>
      ))}
    </Box>
  );
});
