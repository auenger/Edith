import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  AuthStorage,
  createAgentSession,
  DefaultResourceLoader,
  ModelRegistry,
  SessionManager,
} from "@mariozechner/pi-coding-agent";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadConfig, type EdithConfig } from "../config.js";
import edithExtension from "../extension.js";
import { buildSystemPrompt } from "../system-prompt.js";
import { messageReducer, thinkingReducer } from "./types.js";
import type { Message, ThinkingBlock } from "./types.js";
import { ContextMonitor, type PressureState, type RoundData } from "../context-monitor.js";
import { setSharedStats } from "../shared-stats.js";
import type { SessionStats } from "../theme/context-panel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type ThinkingPhase = "thinking" | "tools" | "generating";

export interface AgentSessionState {
  messages: Message[];
  thinkingBlocks: ThinkingBlock[];
  isProcessing: boolean;
  thinkingPhase: ThinkingPhase | null;
  processingStartedAt: number | null;
  outputCharCount: number;
  initialized: boolean;
  error: string | null;
  config: EdithConfig | null;
  sendUserMessage: (text: string) => Promise<void>;
  toggleThinking: (id: string) => void;
  expandAllThinking: () => void;
  collapseAllThinking: () => void;
  monitorData: MonitorData | null;
}

export interface MonitorData {
  latest: RoundData | null;
  cacheHitRate: number;
  pressure: PressureState;
  totalRounds: number;
}

export function useAgentSession(): AgentSessionState {
  const [messages, dispatch] = useReducer(messageReducer, []);
  const [thinkingBlocks, thinkingDispatch] = useReducer(thinkingReducer, []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState<ThinkingPhase | null>(null);
  const [processingStartedAt, setProcessingStartedAt] = useState<number | null>(null);
  const [outputCharCount, setOutputCharCount] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<EdithConfig | null>(null);
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);

  const sessionRef = useRef<any>(null);
  const monitorRef = useRef<ContextMonitor | null>(null);
  const userMsgCountRef = useRef(0);
  const assistantMsgCountRef = useRef(0);
  const toolCallCountRef = useRef(0);
  const toolResultCountRef = useRef(0);

  const initialize = useCallback(async () => {
    try {
      const loadedConfig = loadConfig();
      setConfig(loadedConfig);

      // Initialize context monitor
      const monitor = new ContextMonitor({
        contextWindowOverride: loadedConfig.llm.context_window,
        modelHint: loadedConfig.llm.model,
        thresholds: loadedConfig.context_monitor.thresholds,
      });
      monitorRef.current = monitor;

      const cwd = resolve(__dirname, "..");
      const authStorage = AuthStorage.create();
      const modelRegistry = ModelRegistry.create(authStorage);
      const sessionManager = SessionManager.inMemory();

      const resourceLoader = new DefaultResourceLoader({
        cwd,
        agentDir: cwd,
        extensionFactories: [edithExtension],
      });
      await resourceLoader.reload();

      const model = modelRegistry.find(loadedConfig.llm.provider, loadedConfig.llm.model);
      if (!model) {
        throw new Error(
          `Model not found: ${loadedConfig.llm.provider}/${loadedConfig.llm.model}.`
        );
      }

      const { session } = await createAgentSession({
        sessionManager,
        authStorage,
        modelRegistry,
        resourceLoader,
        model,
      });

      sessionRef.current = session;

      // Subscribe to session events
      session.subscribe((event: any) => {
        // Thinking events from message_update
        if (event.type === "message_update") {
          const sub = event.assistantMessageEvent;
          if (sub.type === "thinking_start") {
            thinkingDispatch({ type: "START_THINKING" });
            setThinkingPhase("thinking");
          } else if (sub.type === "thinking_delta") {
            thinkingDispatch({ type: "APPEND_THINKING", payload: sub.delta });
          } else if (sub.type === "thinking_end") {
            thinkingDispatch({ type: "END_THINKING" });
          } else if (sub.type === "text_delta") {
            dispatch({ type: "APPEND_TO_ASSISTANT", payload: sub.delta });
            setThinkingPhase("generating");
            setOutputCharCount((c) => c + (sub.delta?.length ?? 0));
          }
        }

        // Tool execution events
        if (event.type === "tool_execution_start") {
          toolCallCountRef.current++;
          setThinkingPhase("tools");
          thinkingDispatch({
            type: "START_TOOL_CALL",
            payload: { toolCallId: event.toolCallId, toolName: event.toolName },
          });
        }
        if (event.type === "tool_execution_end") {
          toolResultCountRef.current++;
          const summary = typeof event.result === "string"
            ? event.result.slice(0, 80)
            : event.result?.message ?? event.result?.content ?? "done";
          thinkingDispatch({
            type: "END_TOOL_CALL",
            payload: {
              toolCallId: event.toolCallId,
              summary: String(summary).slice(0, 80),
              isError: event.isError,
            },
          });
        }

        if (event.type === "agent_end") {
          dispatch({ type: "COMPLETE_ASSISTANT" });
          assistantMsgCountRef.current++;
          setIsProcessing(false);
          setThinkingPhase(null);
          setProcessingStartedAt(null);

          // Collect session stats and context usage
          const sdkStats = session.getSessionStats?.();
          const contextUsage = session.getContextUsage?.() as import("../theme/context-panel.js").ContextUsage | undefined;

          // Build complete SessionStats with counted messages/tools
          const fullStats: SessionStats = {
            userMessages: userMsgCountRef.current,
            assistantMessages: assistantMsgCountRef.current,
            toolCalls: toolCallCountRef.current,
            toolResults: toolResultCountRef.current,
            tokens: {
              input: sdkStats?.tokens?.input ?? 0,
              output: sdkStats?.tokens?.output ?? 0,
              cacheRead: sdkStats?.tokens?.cacheRead ?? 0,
              cacheWrite: sdkStats?.tokens?.cacheWrite ?? 0,
              total: sdkStats?.tokens?.total ?? 0,
            },
            cost: sdkStats?.cost ?? 0,
          };

          // Share stats with extension layer for /context command
          setSharedStats(fullStats, contextUsage ?? null);

          // Collect context monitor data after each round
          const mon = monitorRef.current;
          if (mon && loadedConfig.context_monitor.enabled) {
            try {
              if (sdkStats || contextUsage) {
                mon.record(
                  {
                    input: sdkStats?.tokens?.input ?? 0,
                    output: sdkStats?.tokens?.output ?? 0,
                    cacheRead: sdkStats?.tokens?.cacheRead ?? 0,
                    cacheWrite: sdkStats?.tokens?.cacheWrite ?? 0,
                    total: sdkStats?.tokens?.total ?? 0,
                  },
                  {
                    tokens: contextUsage?.tokens ?? 0,
                    contextWindow: contextUsage?.contextWindow ?? 128_000,
                    percent: contextUsage?.percent ?? 0,
                  },
                );

                setMonitorData({
                  latest: mon.latest,
                  cacheHitRate: mon.cacheHitRate,
                  pressure: mon.pressure,
                  totalRounds: mon.totalRounds,
                });
              }
            } catch {
              // Stats collection is best-effort
            }
          }
        }
        if (event.type === "error") {
          dispatch({ type: "ERROR_ASSISTANT", payload: event.error?.message ?? "Unknown error" });
          setIsProcessing(false);
          setThinkingPhase(null);
          setProcessingStartedAt(null);
        }
      });

      // Send system prompt
      const systemPrompt = buildSystemPrompt(loadedConfig.workspace.language);
      await session.prompt(systemPrompt);

      setInitialized(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const sendUserMessage = useCallback(async (text: string) => {
    if (!sessionRef.current) return;

    dispatch({ type: "ADD_USER_MESSAGE", payload: text });
    dispatch({ type: "START_ASSISTANT_MESSAGE" });
    userMsgCountRef.current++;
    setIsProcessing(true);
    setProcessingStartedAt(Date.now());
    setOutputCharCount(0);

    try {
      await sessionRef.current.prompt(text);
    } catch (err) {
      dispatch({ type: "ERROR_ASSISTANT", payload: (err as Error).message });
      setIsProcessing(false);
    }
  }, []);

  const toggleThinking = useCallback((id: string) => {
    thinkingDispatch({ type: "TOGGLE_THINKING", payload: id });
  }, []);

  const expandAllThinking = useCallback(() => {
    thinkingDispatch({ type: "EXPAND_ALL_THINKING" });
  }, []);

  const collapseAllThinking = useCallback(() => {
    thinkingDispatch({ type: "COLLAPSE_ALL_THINKING" });
  }, []);

  const initStartedRef = useRef(false);

  useEffect(() => {
    if (!initStartedRef.current) {
      initStartedRef.current = true;
      initialize();
    }
  }, [initialize]);

  return {
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
  };
}
