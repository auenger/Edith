import React, { useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { BannerArea } from "./BannerArea.js";
import { ContentArea } from "./ContentArea.js";
import { InputArea } from "./InputArea.js";
import { StatusBarMetrics } from "./StatusBarMetrics.js";
import { ThinkingIndicator } from "./ThinkingIndicator.js";
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
    thinkingPhase,
    processingStartedAt,
    outputCharCount,
    initialized,
    error,
    config,
    sendUserMessage,
    toggleThinking,
    expandAllThinking,
    collapseAllThinking,
    monitorData,
  } = useAgentSession();

  // T: toggle last thinking block, Esc: collapse all
  useInput(useCallback((input: string, key: { escape?: boolean }) => {
    if (key.escape) {
      collapseAllThinking();
      return;
    }
    if (input === "t" && thinkingBlocks.length > 0 && isProcessing) {
      const last = thinkingBlocks[thinkingBlocks.length - 1];
      toggleThinking(last.id);
    }
  }, [collapseAllThinking, toggleThinking, thinkingBlocks, isProcessing]));

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
      <ContentArea
        messages={messages}
        thinkingBlocks={thinkingBlocks}
        onToggleThinking={handleToggleThinking}
      />
      <ContextStatusBar config={config} monitorData={monitorData} />
      {showWarning && <WarningBar pressure={monitorData!.pressure} />}
      <ThinkingIndicator
        isActive={isProcessing}
        phase={thinkingPhase}
        startedAt={processingStartedAt}
        outputChars={outputCharCount}
      />
      <InputArea onSubmit={handleSubmit} isProcessing={isProcessing} />
    </Box>
  );
}
