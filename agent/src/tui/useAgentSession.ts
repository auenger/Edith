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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface AgentSessionState {
  messages: Message[];
  thinkingBlocks: ThinkingBlock[];
  isProcessing: boolean;
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
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<EdithConfig | null>(null);
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);

  const sessionRef = useRef<any>(null);
  const monitorRef = useRef<ContextMonitor | null>(null);

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
          } else if (sub.type === "thinking_delta") {
            thinkingDispatch({ type: "APPEND_THINKING", payload: sub.delta });
          } else if (sub.type === "thinking_end") {
            thinkingDispatch({ type: "END_THINKING" });
          } else if (sub.type === "text_delta") {
            dispatch({ type: "APPEND_TO_ASSISTANT", payload: sub.delta });
          }
        }

        // Tool execution events
        if (event.type === "tool_execution_start") {
          thinkingDispatch({
            type: "START_TOOL_CALL",
            payload: { toolCallId: event.toolCallId, toolName: event.toolName },
          });
        }
        if (event.type === "tool_execution_end") {
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
          setIsProcessing(false);

          // Collect context monitor data after each round
          const mon = monitorRef.current;
          if (mon && loadedConfig.context_monitor.enabled) {
            try {
              const sessionStats = session.getSessionStats?.();
              const contextUsage = session.getContextUsage?.();

              if (sessionStats || contextUsage) {
                mon.record(
                  {
                    input: sessionStats?.tokens?.input ?? 0,
                    output: sessionStats?.tokens?.output ?? 0,
                    cacheRead: sessionStats?.tokens?.cacheRead ?? 0,
                    cacheWrite: sessionStats?.tokens?.cacheWrite ?? 0,
                    total: sessionStats?.tokens?.total ?? 0,
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
    setIsProcessing(true);

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
