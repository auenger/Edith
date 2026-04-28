import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

interface InputAreaProps {
  onSubmit: (value: string) => void;
  isProcessing: boolean;
}

export function InputArea({ onSubmit, isProcessing }: InputAreaProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setInput("");
  };

  return (
    <Box borderStyle="single" borderColor="cyan" paddingX={1}>
      <Text color="cyan" bold>EDITH</Text>
      <Text color="gray">{" > "}</Text>
      {isProcessing ? (
        <Text dimColor>thinking...</Text>
      ) : (
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} placeholder="Type your message..." />
      )}
    </Box>
  );
}
