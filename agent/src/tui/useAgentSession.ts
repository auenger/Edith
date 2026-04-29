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

import { loadConfig, getActiveProfile, listProfiles, findConfigFile, saveActiveProfile, type EdithConfig, type LlmProfile } from "../config.js";
import edithExtension from "../extension.js";
import { buildSystemPrompt } from "../system-prompt.js";
import { messageReducer, thinkingReducer, toolCallReducer } from "./types.js";
import type { Message, ThinkingBlock, ToolCallBlock } from "./types.js";
import { ContextMonitor, type PressureState, type RoundData } from "../context-monitor.js";
import { setSharedStats } from "../shared-stats.js";
import type { SessionStats } from "../theme/context-panel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type ThinkingPhase = "thinking" | "tools" | "generating";

export interface AgentSessionState {
  messages: Message[];
  thinkingBlocks: ThinkingBlock[];
  toolCallBlocks: ToolCallBlock[];
  isProcessing: boolean;
  thinkingPhase: ThinkingPhase | null;
  processingStartedAt: number | null;
  outputCharCount: number;
  accumulatedTokens: number;
  initialized: boolean;
  error: string | null;
  config: EdithConfig | null;
  sendUserMessage: (text: string) => Promise<void>;
  sendSlashCommand: (text: string) => Promise<void>;
  dispatch: React.Dispatch<import("./types.js").MessageAction>;
  toggleThinking: (id: string) => void;
  expandAllThinking: () => void;
  collapseAllThinking: () => void;
  monitorData: MonitorData | null;
  switchProfile: (profileName: string) => Promise<string>;
  activeProfileName: string | null;
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
  const [toolCallBlocks, toolCallDispatch] = useReducer(toolCallReducer, []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState<ThinkingPhase | null>(null);
  const [processingStartedAt, setProcessingStartedAt] = useState<number | null>(null);
  const [outputCharCount, setOutputCharCount] = useState(0);
  const [accumulatedTokens, setAccumulatedTokens] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<EdithConfig | null>(null);
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);

  const sessionRef = useRef<any>(null);
  const monitorRef = useRef<ContextMonitor | null>(null);
  const configRef = useRef<EdithConfig | null>(null);
  const configPathRef = useRef<string | null>(null);
  const modelRegistryRef = useRef<any>(null);
  const resourceLoaderRef = useRef<any>(null);
  const sessionManagerRef = useRef<any>(null);
  const authStorageRef = useRef<any>(null);
  const [activeProfileName, setActiveProfileName] = useState<string | null>(null);
  const userMsgCountRef = useRef(0);
  const assistantMsgCountRef = useRef(0);
  const toolCallCountRef = useRef(0);
  const toolResultCountRef = useRef(0);

  const initialize = useCallback(async () => {
    try {
      const loadedConfig = loadConfig();
      const cfgPath = findConfigFile();
      configPathRef.current = cfgPath;
      setConfig(loadedConfig);
      configRef.current = loadedConfig;

      const activeProfile = getActiveProfile(loadedConfig);
      setActiveProfileName(loadedConfig.llm.active ?? "default");

      // Initialize context monitor
      const monitor = new ContextMonitor({
        contextWindowOverride: activeProfile.context_window,
        modelHint: activeProfile.model,
        thresholds: loadedConfig.context_monitor.thresholds,
      });
      monitorRef.current = monitor;

      const cwd = resolve(__dirname, "..");
      const authStorage = AuthStorage.create();
      const modelRegistry = ModelRegistry.create(authStorage);
      const sessionManager = SessionManager.inMemory();

      // Register custom providers for all profiles with base_url
      if (loadedConfig.llm.profiles) {
        for (const [name, profile] of Object.entries(loadedConfig.llm.profiles)) {
          if (profile.base_url) {
            if (!profile.api_key) {
              console.warn(`[EDITH] Profile '${name}': skipped registerProvider (base_url requires api_key)`);
              continue;
            }
            try {
              modelRegistry.registerProvider(profile.provider, {
                api: (profile.api_type as any) ?? "openai-completions",
                baseUrl: profile.base_url,
                apiKey: profile.api_key,
                models: [{
                  id: profile.model,
                  name: profile.model,
                  reasoning: false,
                  input: ["text"],
                  contextWindow: profile.context_window ?? 128000,
                  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                  maxTokens: 8192,
                }],
              });
              console.log(`[EDITH] Registered custom provider: ${profile.provider} (${name})`);
            } catch (err) {
              console.warn(`[EDITH] Failed to register provider '${profile.provider}': ${(err as Error).message}`);
            }
          }
        }
      }

      // Also handle legacy base_url on the top-level config
      if (!loadedConfig.llm.profiles && loadedConfig.llm.base_url && loadedConfig.llm.api_key) {
        try {
          modelRegistry.registerProvider(loadedConfig.llm.provider, {
            api: "openai-completions" as any,
            baseUrl: loadedConfig.llm.base_url,
            apiKey: loadedConfig.llm.api_key,
            models: [{
              id: loadedConfig.llm.model,
              name: loadedConfig.llm.model,
              reasoning: false,
              input: ["text"],
              contextWindow: loadedConfig.llm.context_window ?? 128000,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              maxTokens: 8192,
            }],
          });
          console.log(`[EDITH] Registered custom provider: ${loadedConfig.llm.provider}`);
        } catch (err) {
          console.warn(`[EDITH] Failed to register provider '${loadedConfig.llm.provider}': ${(err as Error).message}`);
        }
      }

      modelRegistryRef.current = modelRegistry;
      sessionManagerRef.current = sessionManager;
      authStorageRef.current = authStorage;

      const resourceLoader = new DefaultResourceLoader({
        cwd,
        agentDir: cwd,
        extensionFactories: [edithExtension],
      });
      await resourceLoader.reload();
      resourceLoaderRef.current = resourceLoader;

      const model = modelRegistry.find(activeProfile.provider, activeProfile.model);
      if (!model) {
        throw new Error(
          `Model not found: ${activeProfile.provider}/${activeProfile.model}.`
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
          toolCallDispatch({
            type: "START_TOOL_CALL",
            payload: {
              toolCallId: event.toolCallId,
              toolName: event.toolName,
              args: event.args ? String(event.args).slice(0, 200) : undefined,
            },
          });
        }
        if (event.type === "tool_execution_end") {
          toolResultCountRef.current++;
          const result = typeof event.result === "string"
            ? event.result.slice(0, 200)
            : event.result?.message ?? event.result?.content ?? "done";
          toolCallDispatch({
            type: "END_TOOL_CALL",
            payload: {
              toolCallId: event.toolCallId,
              result: String(result).slice(0, 200),
              isError: event.isError,
            },
          });

          // Incremental CTX refresh after each tool call
          const mon = monitorRef.current;
          if (mon && loadedConfig.context_monitor.enabled) {
            try {
              const sdkStats = session.getSessionStats?.();
              const contextUsage = session.getContextUsage?.() as import("../theme/context-panel.js").ContextUsage | undefined;
              const tokenTotal = sdkStats?.tokens?.total ?? 0;

              if (tokenTotal > 0) {
                // Fallback for non-Anthropic providers: derive percent from token total
                const ctxTokens = contextUsage?.tokens ?? tokenTotal;
                const ctxWindow = contextUsage?.contextWindow ?? activeProfile.context_window ?? 128_000;
                const ctxPercent = contextUsage?.percent ?? (ctxTokens / ctxWindow);

                mon.record(
                  {
                    input: sdkStats?.tokens?.input ?? 0,
                    output: sdkStats?.tokens?.output ?? 0,
                    cacheRead: sdkStats?.tokens?.cacheRead ?? 0,
                    cacheWrite: sdkStats?.tokens?.cacheWrite ?? 0,
                    total: tokenTotal,
                  },
                  {
                    tokens: ctxTokens,
                    contextWindow: ctxWindow,
                    percent: ctxPercent,
                  },
                );

                setMonitorData({
                  latest: mon.latest,
                  cacheHitRate: mon.cacheHitRate,
                  pressure: mon.pressure,
                  totalRounds: mon.totalRounds,
                });

                setAccumulatedTokens(tokenTotal);
              }
            } catch {
              // Stats collection is best-effort
            }
          }
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

          // Update accumulated tokens at round end
          const tokenTotal = sdkStats?.tokens?.total ?? 0;
          if (tokenTotal > 0) {
            setAccumulatedTokens(tokenTotal);
          }

          // Collect context monitor data after each round
          const mon = monitorRef.current;
          if (mon && loadedConfig.context_monitor.enabled) {
            try {
              if (sdkStats || contextUsage) {
                // Fallback for non-Anthropic providers
                const ctxTokens = contextUsage?.tokens ?? tokenTotal;
                const ctxWindow = contextUsage?.contextWindow ?? activeProfile.context_window ?? 128_000;
                const ctxPercent = contextUsage?.percent ?? (ctxTokens / ctxWindow);

                mon.record(
                  {
                    input: sdkStats?.tokens?.input ?? 0,
                    output: sdkStats?.tokens?.output ?? 0,
                    cacheRead: sdkStats?.tokens?.cacheRead ?? 0,
                    cacheWrite: sdkStats?.tokens?.cacheWrite ?? 0,
                    total: tokenTotal,
                  },
                  {
                    tokens: ctxTokens,
                    contextWindow: ctxWindow,
                    percent: ctxPercent,
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
    setAccumulatedTokens(0);

    try {
      await sessionRef.current.prompt(text);
    } catch (err) {
      dispatch({ type: "ERROR_ASSISTANT", payload: (err as Error).message });
      setIsProcessing(false);
    }
  }, []);

  const sendSlashCommand = useCallback(async (text: string) => {
    if (!sessionRef.current) return;

    try {
      await sessionRef.current.prompt(text);
    } catch (err) {
      dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `[ERROR] ${(err as Error).message}` });
    }
  }, [dispatch]);

  const toggleThinking = useCallback((id: string) => {
    thinkingDispatch({ type: "TOGGLE_THINKING", payload: id });
  }, []);

  const expandAllThinking = useCallback(() => {
    thinkingDispatch({ type: "EXPAND_ALL_THINKING" });
  }, []);

  const collapseAllThinking = useCallback(() => {
    thinkingDispatch({ type: "COLLAPSE_ALL_THINKING" });
  }, []);

  const switchProfile = useCallback(async (profileName: string): Promise<string> => {
    const cfg = configRef.current;
    if (!cfg || !cfg.llm.profiles) {
      return "No profiles configured";
    }

    const profile = cfg.llm.profiles[profileName];
    if (!profile) {
      const available = listProfiles(cfg);
      return `Profile '${profileName}' not found. Available: ${available.join(", ")}`;
    }

    // Update active in config
    cfg.llm.active = profileName;
    setActiveProfileName(profileName);

    // Register provider if needed (may already be registered from init)
    if (profile.base_url && profile.api_key) {
      try {
        modelRegistryRef.current?.registerProvider(profile.provider, {
          api: (profile.api_type as any) ?? "openai-completions",
          baseUrl: profile.base_url,
          apiKey: profile.api_key,
          models: [{
            id: profile.model,
            name: profile.model,
            reasoning: false,
            input: ["text"],
            contextWindow: profile.context_window ?? 128000,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            maxTokens: 8192,
          }],
        });
      } catch {
        // Provider may already be registered
      }
    }

    const model = modelRegistryRef.current?.find(profile.provider, profile.model);
    if (!model) {
      return `Model not found: ${profile.provider}/${profile.model}`;
    }

    // Create new session with the new model
    const { session } = await createAgentSession({
      sessionManager: sessionManagerRef.current,
      authStorage: authStorageRef.current,
      modelRegistry: modelRegistryRef.current,
      resourceLoader: resourceLoaderRef.current,
      model,
    });

    sessionRef.current = session;

    // Re-subscribe events for the new session
    session.subscribe((event: any) => {
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
      if (event.type === "tool_execution_start") {
        toolCallCountRef.current++;
        setThinkingPhase("tools");
        toolCallDispatch({
          type: "START_TOOL_CALL",
          payload: {
            toolCallId: event.toolCallId,
            toolName: event.toolName,
            args: event.args ? String(event.args).slice(0, 200) : undefined,
          },
        });
      }
      if (event.type === "tool_execution_end") {
        toolResultCountRef.current++;
        const result = typeof event.result === "string"
          ? event.result.slice(0, 200)
          : event.result?.message ?? event.result?.content ?? "done";
        toolCallDispatch({
          type: "END_TOOL_CALL",
          payload: {
            toolCallId: event.toolCallId,
            result: String(result).slice(0, 200),
            isError: event.isError,
          },
        });

        // Incremental CTX refresh after each tool call
        const mon = monitorRef.current;
        if (mon && cfg.context_monitor.enabled) {
          try {
            const sdkStats = session.getSessionStats?.();
            const contextUsage = session.getContextUsage?.() as import("../theme/context-panel.js").ContextUsage | undefined;
            const tokenTotal = sdkStats?.tokens?.total ?? 0;

            if (tokenTotal > 0) {
              const ctxTokens = contextUsage?.tokens ?? tokenTotal;
              const ctxWindow = contextUsage?.contextWindow ?? profile.context_window ?? 128_000;
              const ctxPercent = contextUsage?.percent ?? (ctxTokens / ctxWindow);

              mon.record(
                {
                  input: sdkStats?.tokens?.input ?? 0,
                  output: sdkStats?.tokens?.output ?? 0,
                  cacheRead: sdkStats?.tokens?.cacheRead ?? 0,
                  cacheWrite: sdkStats?.tokens?.cacheWrite ?? 0,
                  total: tokenTotal,
                },
                {
                  tokens: ctxTokens,
                  contextWindow: ctxWindow,
                  percent: ctxPercent,
                },
              );

              setMonitorData({
                latest: mon.latest,
                cacheHitRate: mon.cacheHitRate,
                pressure: mon.pressure,
                totalRounds: mon.totalRounds,
              });

              setAccumulatedTokens(tokenTotal);
            }
          } catch {
            // Stats collection is best-effort
          }
        }
      }
      if (event.type === "agent_end") {
        dispatch({ type: "COMPLETE_ASSISTANT" });
        assistantMsgCountRef.current++;
        setIsProcessing(false);
        setThinkingPhase(null);
        setProcessingStartedAt(null);

        // Update accumulated tokens at round end
        const sdkStats = session.getSessionStats?.();
        const tokenTotal = sdkStats?.tokens?.total ?? 0;
        if (tokenTotal > 0) {
          setAccumulatedTokens(tokenTotal);
        }
      }
      if (event.type === "error") {
        dispatch({ type: "ERROR_ASSISTANT", payload: event.error?.message ?? "Unknown error" });
        setIsProcessing(false);
        setThinkingPhase(null);
        setProcessingStartedAt(null);
      }
    });

    // Send system prompt to new session
    const systemPrompt = buildSystemPrompt(cfg.workspace.language);
    await session.prompt(systemPrompt);

    // Persist active profile to edith.yaml
    const cfgPath = configPathRef.current;
    if (cfgPath) {
      saveActiveProfile(cfgPath, profileName);
    }

    return `Switched to ${profile.model} (${profileName})`;
  }, [dispatch]);

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
    toolCallBlocks,
    isProcessing,
    thinkingPhase,
    processingStartedAt,
    outputCharCount,
    accumulatedTokens,
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
  };
}
