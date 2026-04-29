import React, { useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { BannerArea } from "./BannerArea.js";
import { ContentArea } from "./ContentArea.js";
import { InputArea } from "./InputArea.js";
import { StatusBarMetrics } from "./StatusBarMetrics.js";
import { ThinkingIndicator } from "./ThinkingIndicator.js";
import { WarningBar } from "./WarningBar.js";
import { useAgentSession } from "./useAgentSession.js";
import { findCommand, type SlashCommand } from "./command-registry.js";
import { getSharedStats } from "../shared-stats.js";
import { loadConfig, getActiveProfile, listProfiles } from "../config.js";
import type { EdithConfig } from "../config.js";
import type { MessageAction } from "./types.js";

function ContextStatusBar({ config, monitorData, modelName, isCustomProvider }: {
  config: EdithConfig | null;
  monitorData: import("./useAgentSession.js").MonitorData | null;
  modelName?: string;
  isCustomProvider?: boolean;
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
      modelName={modelName}
      isCustomProvider={isCustomProvider}
    />
  );
}

function formatContextPanel(): string {
  const { stats, usage } = getSharedStats();
  const lines: string[] = [];
  lines.push("═══ Context ═══");
  if (usage?.tokens != null && usage.contextWindow) {
    const pct = usage.percent ?? 0;
    lines.push(`  Tokens: ${usage.tokens.toLocaleString()} / ${usage.contextWindow.toLocaleString()}`);
    lines.push(`  Usage:  ${pct.toFixed(1)}%`);
  } else {
    lines.push("  Tokens: N/A");
  }
  lines.push("");
  if (stats) {
    lines.push(`  Messages  User: ${stats.userMessages}   Assistant: ${stats.assistantMessages}`);
    lines.push(`  Tools     Calls: ${stats.toolCalls}   Results: ${stats.toolResults}`);
    lines.push("");
    lines.push("  Token Detail");
    lines.push(`    Input:   ${stats.tokens.input.toLocaleString()}  Output: ${stats.tokens.output.toLocaleString()}`);
    lines.push(`    Cache:   R: ${stats.tokens.cacheRead.toLocaleString()}  W: ${stats.tokens.cacheWrite.toLocaleString()}`);
    lines.push(`    Cost:    $${stats.cost.toFixed(3)}`);
  }
  lines.push("═════════════════════");
  return lines.join("\n");
}

function formatStatusPanel(): string {
  const { stats, usage } = getSharedStats();
  const lines: string[] = [];
  lines.push("═══ EDITH Status ═══");
  lines.push("");

  let config: EdithConfig | null = null;
  try { config = loadConfig(); } catch { /* ignore */ }

  if (config) {
    lines.push(`  Workspace: ${config.workspace.root}`);
    lines.push(`  Repos:     ${config.repos.length} configured`);
    lines.push(`  Language:  ${config.workspace.language}`);
  }

  if (usage?.tokens != null) {
    lines.push("");
    lines.push(`  Context: ${usage.tokens.toLocaleString()} tokens (${usage.percent?.toFixed(1) ?? "N/A"}%)`);
  }

  if (stats) {
    lines.push("");
    lines.push(`  Rounds:   ${stats.assistantMessages}`);
    lines.push(`  Tokens:   ${stats.tokens.total.toLocaleString()}`);
    lines.push(`  Cost:     $${stats.cost.toFixed(3)}`);
  }

  lines.push("");
  lines.push("═════════════════════");
  return lines.join("\n");
}

export function App() {
  const { exit } = useApp();
  const {
    messages,
    thinkingBlocks,
    toolCallBlocks,
    isProcessing,
    thinkingPhase,
    processingStartedAt,
    outputCharCount,
    initialized,
    error,
    config,
    sendUserMessage,
    sendSlashCommand,
    dispatch,
    toggleThinking,
    expandAllThinking,
    collapseAllThinking,
    monitorData,
    switchProfile,
    activeProfileName,
  } = useAgentSession();

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

  const handleLocalCommand = useCallback((cmd: SlashCommand, _dispatch: React.Dispatch<MessageAction>) => {
    switch (cmd.name) {
      case "context":
        _dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: formatContextPanel() });
        break;
      case "status":
        _dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: formatStatusPanel() });
        break;
      case "model":
        // /model is handled async in handleCommand
        break;
      default:
        _dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `Unknown local command: /${cmd.name}` });
    }
  }, []);

  const handleCommand = useCallback(async (text: string) => {
    const cmdDef = findCommand(text);

    if (!cmdDef) {
      dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `Unknown command: ${text}\n  Type / to see available commands.` });
      return;
    }

    // /model command — special handling
    if (cmdDef.name === "model") {
      const parts = text.trim().split(/\s+/);
      const profileArg = parts[1];

      if (!profileArg) {
        // List all profiles
        if (!config?.llm.profiles) {
          dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: "No profiles configured (using legacy single-provider mode)." });
          return;
        }
        const profiles = listProfiles(config);
        const active = config.llm.active ?? "default";
        const lines = profiles.map((name) => {
          const p = config.llm.profiles![name];
          const marker = name === active ? " ← active" : "";
          return `  ${name}: ${p.provider}/${p.model}${marker}`;
        });
        dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `Profiles:\n${lines.join("\n")}` });
        return;
      }

      // Switch profile
      dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `[System] Switching model to '${profileArg}'...` });
      const result = await switchProfile(profileArg);
      dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `[System] ${result}` });
      return;
    }

    switch (cmdDef.type) {
      case "local":
        handleLocalCommand(cmdDef, dispatch);
        break;
      case "session":
        await sendSlashCommand(text);
        dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `/${cmdDef.name} executed.` });
        break;
      case "agent":
        await sendUserMessage(text);
        break;
    }
  }, [dispatch, handleLocalCommand, sendSlashCommand, sendUserMessage, switchProfile, config]);

  const handleSubmit = useCallback(
    async (text: string) => {
      if (text.toLowerCase() === "exit" || text.toLowerCase() === "quit") {
        await exit();
        return;
      }
      if (text.startsWith("/")) {
        await handleCommand(text);
        return;
      }
      await sendUserMessage(text);
    },
    [sendUserMessage, exit, handleCommand]
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

  // Derive model display info from config
  let modelName: string | undefined;
  let isCustomProvider: boolean | undefined;
  if (config) {
    try {
      const profile = getActiveProfile(config);
      modelName = profile.model;
      isCustomProvider = !!profile.base_url;
    } catch { /* ignore */ }
  }

  return (
    <Box flexDirection="column" height="100%">
      <BannerArea config={{ workspace: config!.workspace }} />
      <ContentArea
        messages={messages}
        thinkingBlocks={thinkingBlocks}
        toolCallBlocks={toolCallBlocks}
        onToggleThinking={handleToggleThinking}
      />
      <ContextStatusBar config={config} monitorData={monitorData} modelName={modelName} isCustomProvider={isCustomProvider} />
      {showWarning && <WarningBar pressure={monitorData!.pressure} />}
      <ThinkingIndicator
        isActive={isProcessing}
        phase={thinkingPhase}
        startedAt={processingStartedAt}
        outputChars={outputCharCount}
      />
      <InputArea onSubmit={handleSubmit} onCommand={handleCommand} isProcessing={isProcessing} />
    </Box>
  );
}
