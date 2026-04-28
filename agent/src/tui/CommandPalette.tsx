import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { filterCommands, type SlashCommand } from "./command-registry.js";

interface CommandPaletteProps {
  query: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  local: "green",
  session: "yellow",
  agent: "magenta",
};

const TYPE_LABELS: Record<string, string> = {
  local: "local  ",
  session: "session",
  agent: "agent  ",
};

export function CommandPalette({ query, onSelect, onClose }: CommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const filtered = filterCommands(query);

  const safeIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1));

  useInput(useCallback(
    (input: string, key: { upArrow?: boolean; downArrow?: boolean; tab?: boolean; escape?: boolean; return?: boolean }) => {
      if (key.escape) {
        onClose();
        return;
      }

      if (filtered.length === 0) return;

      if (key.upArrow) {
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
        return;
      }

      if (key.downArrow) {
        setSelectedIndex((i) => (i + 1) % filtered.length);
        return;
      }

      if (key.tab || key.return) {
        onSelect(filtered[safeIndex]);
        return;
      }
    },
    [filtered, safeIndex, onSelect, onClose]
  ));

  if (filtered.length === 0) {
    return (
      <Box paddingX={1}>
        <Text dimColor>  No matching commands for "{query}"</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {filtered.map((cmd, i) => {
        const isSelected = i === safeIndex;
        const typeColor = TYPE_COLORS[cmd.type] ?? "gray";
        const typeLabel = TYPE_LABELS[cmd.type] ?? cmd.type;
        const aliasStr = cmd.aliases?.length ? ` (${cmd.aliases.join(", ")})` : "";

        return (
          <Box key={cmd.name}>
            <Text>{isSelected ? "  " : "  "}</Text>
            {isSelected ? (
              <Text color="cyan" bold>{`❯ /${cmd.name}`}</Text>
            ) : (
              <Text dimColor>{`  /${cmd.name}`}</Text>
            )}
            <Text> </Text>
            <Text color={typeColor} dimColor={!isSelected}>{`[${typeLabel}]`}</Text>
            <Text> </Text>
            <Text dimColor={!isSelected}>{`${cmd.description}${aliasStr}`}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
