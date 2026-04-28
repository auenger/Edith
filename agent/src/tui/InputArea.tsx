import React, { useRef, useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { CommandPalette } from "./CommandPalette.js";
import type { SlashCommand } from "./command-registry.js";

interface InputAreaProps {
  onSubmit: (value: string) => void;
  onCommand: (command: string) => void;
  isProcessing: boolean;
}

export function InputArea({ onSubmit, onCommand, isProcessing }: InputAreaProps) {
  const [input, setInput] = useState("");
  const [showPalette, setShowPalette] = useState(false);
  const commandSelectedRef = useRef(false);

  const isSlashInput = input.startsWith("/") && !isProcessing;

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.startsWith("/") && !isProcessing) {
      setShowPalette(true);
    } else {
      setShowPalette(false);
    }
  };

  const handleSubmit = (value: string) => {
    if (commandSelectedRef.current) {
      commandSelectedRef.current = false;
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("/")) {
      onCommand(trimmed);
    } else {
      onSubmit(trimmed);
    }
    setInput("");
    setShowPalette(false);
  };

  const handlePaletteSelect = (cmd: SlashCommand) => {
    commandSelectedRef.current = true;
    onCommand(`/${cmd.name}`);
    setInput("");
    setShowPalette(false);
  };

  const handlePaletteClose = () => {
    setShowPalette(false);
  };

  return (
    <Box flexDirection="column">
      {isSlashInput && showPalette && (
        <CommandPalette
          query={input.slice(1)}
          onSelect={handlePaletteSelect}
          onClose={handlePaletteClose}
        />
      )}
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text color="cyan" bold>EDITH</Text>
        <Text color="gray">{" > "}</Text>
        {isProcessing ? (
          <Text dimColor>thinking...</Text>
        ) : (
          <TextInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            placeholder="Type your message... (try / for commands)"
          />
        )}
      </Box>
    </Box>
  );
}
