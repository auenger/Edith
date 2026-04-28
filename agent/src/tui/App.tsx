import React, { useCallback } from "react";
import { Box, Text, useApp } from "ink";
import { BannerArea } from "./BannerArea.js";
import { ContentArea } from "./ContentArea.js";
import { InputArea } from "./InputArea.js";
import { useAgentSession } from "./useAgentSession.js";
import type { EdithConfig } from "../config.js";

export function App() {
  const { exit } = useApp();
  const { messages, isProcessing, initialized, error, config, sendUserMessage } = useAgentSession();

  const handleSubmit = useCallback(
    async (text: string) => {
      if (text.toLowerCase() === "exit" || text.toLowerCase() === "quit") {
        await exit();
        return;
      }
      await sendUserMessage(text);
    },
    [sendUserMessage, exit]
  );

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red" bold>EDITH Initialization Failed</Text>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  if (!initialized) {
    return (
      <Box flexDirection="column" padding={1}>
        <BannerArea config={config ? { workspace: config.workspace } : undefined} />
        <Box paddingX={1} marginTop={1}>
          <Text color="cyan">Initializing agent session...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      <BannerArea config={{ workspace: config!.workspace }} />
      <ContentArea messages={messages} />
      <InputArea onSubmit={handleSubmit} isProcessing={isProcessing} />
    </Box>
  );
}
