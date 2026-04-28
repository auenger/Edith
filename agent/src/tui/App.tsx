import React, { useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { BannerArea } from "./BannerArea.js";
import { ContentArea } from "./ContentArea.js";
import { InputArea } from "./InputArea.js";
import { StatusBarMetrics } from "./StatusBarMetrics.js";
import { WarningBar } from "./WarningBar.js";
import { useAgentSession } from "./useAgentSession.js";
import type { EdithConfig } from "../config.js";

function ContextStatusBar({ config, monitorData }: {
  config: EdithConfig | null;
  monitorData: import("./useAgentSession.js").MonitorData | null;
}) {
  if (!monitorData?.latest || !config) return null;

  const ctx = monitorData.latest.context;
  const monitorEnabled = config.context_monitor.enabled;
  if (!monitorEnabled) return null;

  return (
    <StatusBarMetrics
      tokens={ctx.tokens}
      contextWindow={ctx.contextWindow}
      percent={ctx.percent}
      cacheHitRate={monitorData.cacheHitRate}
      pressureLevel={monitorData.pressure.level}
    />
  );
}

export function App() {
  const { exit } = useApp();
  const {
    messages,
    thinkingBlocks,
    isProcessing,
    initialized,
    error,
    config,
    sendUserMessage,
    toggleThinking,
    expandAllThinking,
    collapseAllThinking,
    monitorData,
  } = useAgentSession();

  // T key: toggle last thinking block or expand/collapse all
  useInput(useCallback((_input: string, key: { escape?: boolean }) => {
    if (key.escape) {
      collapseAllThinking();
    }
  }, [collapseAllThinking]));

  const handleToggleThinking = useCallback((id: string) => {
    toggleThinking(id);
  }, [toggleThinking]);

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

  const showWarning = monitorData?.pressure && monitorData.pressure.level !== "normal";

  return (
    <Box flexDirection="column" height="100%">
      <BannerArea config={{ workspace: config!.workspace }} />
      <ContextStatusBar config={config} monitorData={monitorData} />
      {showWarning && <WarningBar pressure={monitorData!.pressure} />}
      <ContentArea
        messages={messages}
        thinkingBlocks={thinkingBlocks}
        onToggleThinking={handleToggleThinking}
      />
      <InputArea onSubmit={handleSubmit} isProcessing={isProcessing} />
    </Box>
  );
}
