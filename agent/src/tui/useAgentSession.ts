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

/**
 * Resolve context tokens: prefer exact API value → percent-based estimate → cumulative fallback.
 * Fixes non-Anthropic providers where contextUsage.tokens is null but percent is available.
 */
function resolveContextTokens(
  contextUsage: { tokens?: number | null; percent?: number | null } | undefined,
  tokenTotal: number,
  ctxWindow: number,
): number {
  if (contextUsage?.tokens != null) return contextUsage.tokens;
  if (contextUsage?.percent != null) return Math.round(contextUsage.percent * ctxWindow);
  return tokenTotal;
}

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
  handleNewSession: (options?: { withSteer?: boolean }) => Promise<void>;
  resetSessionState: () => void;
  dispatch: React.Dispatch<import("./types.js").MessageAction>;
  thinkingDispatch: React.Dispatch<import("./types.js").MessageAction>;
  toolCallDispatch: React.Dispatch<import("./types.js").ToolCallAction>;
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
  const assistantSegmentClosedRef = useRef(false);
  const suppressDisplayRef = useRef(true);
  const handleNewSessionRef = useRef<(options?: { withSteer?: boolean }) => Promise<void>>();

  // Subscribe handler — extracted to avoid duplication across initialize/switchProfile/handleNewSession
  const subscribeSessionEvents = (session: any, profile: LlmProfile) => {
    const cfg = configRef.current!;
    suppressDisplayRef.current = true;

    session.subscribe((event: any) => {
      if (suppressDisplayRef.current) return;

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
          if (assistantSegmentClosedRef.current) {
            dispatch({ type: "START_ASSISTANT_MESSAGE" });
            assistantSegmentClosedRef.current = false;
          }
          dispatch({ type: "APPEND_TO_ASSISTANT", payload: sub.delta });
          setThinkingPhase("generating");
          setOutputCharCount((c) => c + (sub.delta?.length ?? 0));
        }
      }

      if (event.type === "tool_execution_start") {
        toolCallCountRef.current++;
        setThinkingPhase("tools");
        assistantSegmentClosedRef.current = true;
        dispatch({ type: "COMPLETE_ASSISTANT" });
        toolCallDispatch({
          type: "START_TOOL_CALL",
          payload: {
            toolCallId: event.toolCallId,
            toolName: event.toolName,
            args: event.args ? JSON.stringify(event.args).slice(0, 200) : undefined,
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
            result: (typeof result === "string" ? result : JSON.stringify(result)).slice(0, 200),
            isError: event.isError,
          },
        });

        const mon = monitorRef.current;
        if (mon && cfg.context_monitor.enabled) {
          try {
            const sdkStats = session.getSessionStats?.();
            const contextUsage = session.getContextUsage?.() as import("../theme/context-panel.js").ContextUsage | undefined;
            const tokenTotal = sdkStats?.tokens?.total ?? 0;

            if (tokenTotal > 0) {
              const ctxWindow = contextUsage?.contextWindow ?? profile.context_window ?? 128_000;
              const ctxTokens = resolveContextTokens(contextUsage, tokenTotal, ctxWindow);
              const ctxPercent = contextUsage?.percent ?? (ctxTokens / ctxWindow);

              mon.record(
                { input: sdkStats?.tokens?.input ?? 0, output: sdkStats?.tokens?.output ?? 0, cacheRead: sdkStats?.tokens?.cacheRead ?? 0, cacheWrite: sdkStats?.tokens?.cacheWrite ?? 0, total: tokenTotal },
                { tokens: ctxTokens, contextWindow: ctxWindow, percent: ctxPercent },
              );

              setMonitorData({ latest: mon.latest, cacheHitRate: mon.cacheHitRate, pressure: mon.pressure, totalRounds: mon.totalRounds });
              setAccumulatedTokens(tokenTotal);
            }
          } catch { /* best-effort */ }
        }
      }

      // Compaction events
      if (event.type === "compaction_start") {
        dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `[System] Compacting context...` });
      }
      if (event.type === "compaction_end") {
        if (event.aborted) {
          dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `[System] Compaction aborted.` });
        } else if (event.errorMessage) {
          dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `[System] Compaction failed: ${event.errorMessage}` });
        } else {
          const result = event.result;
          if (result) {
            // CompactionResult has tokensBefore but NOT tokensAfter.
            // Read current context usage to get the after value.
            const before = result.tokensBefore?.toLocaleString() ?? "?";
            let afterStr = "?";
            try {
              const ctxUsage = session.getContextUsage?.() as import("../theme/context-panel.js").ContextUsage | undefined;
              if (ctxUsage?.tokens != null) {
                afterStr = ctxUsage.tokens.toLocaleString();
              } else if (ctxUsage?.percent != null) {
                const window = ctxUsage.contextWindow ?? profile.context_window ?? 128_000;
                afterStr = `~${Math.round(ctxUsage.percent * window).toLocaleString()}`;
              }
            } catch { /* best-effort */ }
            dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `[System] Compacted: ${before} → ${afterStr} tokens` });
          } else {
            dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `[System] Compaction complete.` });
          }
        }

        // Refresh context stats after compaction
        const mon = monitorRef.current;
        if (mon && cfg.context_monitor.enabled) {
          try {
            const sdkStats = session.getSessionStats?.();
            const contextUsage = session.getContextUsage?.() as import("../theme/context-panel.js").ContextUsage | undefined;
            const tokenTotal = sdkStats?.tokens?.total ?? 0;
            if (sdkStats || contextUsage) {
              const ctxWindow = contextUsage?.contextWindow ?? profile.context_window ?? 128_000;
              const ctxTokens = resolveContextTokens(contextUsage, tokenTotal, ctxWindow);
              const ctxPercent = contextUsage?.percent ?? (ctxTokens / ctxWindow);

              mon.record(
                { input: sdkStats?.tokens?.input ?? 0, output: sdkStats?.tokens?.output ?? 0, cacheRead: sdkStats?.tokens?.cacheRead ?? 0, cacheWrite: sdkStats?.tokens?.cacheWrite ?? 0, total: tokenTotal },
                { tokens: ctxTokens, contextWindow: ctxWindow, percent: ctxPercent },
              );

              setMonitorData({ latest: mon.latest, cacheHitRate: mon.cacheHitRate, pressure: mon.pressure, totalRounds: mon.totalRounds });
            }
          } catch { /* best-effort */ }
        }
      }

      if (event.type === "agent_end") {
        dispatch({ type: "COMPLETE_ASSISTANT" });
        assistantMsgCountRef.current++;
        setIsProcessing(false);
        setThinkingPhase(null);
        setProcessingStartedAt(null);

        const sdkStats = session.getSessionStats?.();
        const contextUsage = session.getContextUsage?.() as import("../theme/context-panel.js").ContextUsage | undefined;

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

        setSharedStats(fullStats, contextUsage ?? null);

        const tokenTotal = sdkStats?.tokens?.total ?? 0;
        if (tokenTotal > 0) {
          setAccumulatedTokens(tokenTotal);
        }

        const mon = monitorRef.current;
        if (mon && cfg.context_monitor.enabled) {
          try {
            if (sdkStats || contextUsage) {
              const ctxWindow = contextUsage?.contextWindow ?? profile.context_window ?? 128_000;
              const ctxTokens = resolveContextTokens(contextUsage, tokenTotal, ctxWindow);
              const ctxPercent = contextUsage?.percent ?? (ctxTokens / ctxWindow);

              mon.record(
                { input: sdkStats?.tokens?.input ?? 0, output: sdkStats?.tokens?.output ?? 0, cacheRead: sdkStats?.tokens?.cacheRead ?? 0, cacheWrite: sdkStats?.tokens?.cacheWrite ?? 0, total: tokenTotal },
                { tokens: ctxTokens, contextWindow: ctxWindow, percent: ctxPercent },
              );

              setMonitorData({ latest: mon.latest, cacheHitRate: mon.cacheHitRate, pressure: mon.pressure, totalRounds: mon.totalRounds });
            }
          } catch { /* best-effort */ }
        }
      }
      if (event.type === "error") {
        dispatch({ type: "ERROR_ASSISTANT", payload: event.error?.message ?? "Unknown error" });
        setIsProcessing(false);
        setThinkingPhase(null);
        setProcessingStartedAt(null);
      }
    });
  };

  // Shared session creation + bindExtensions + subscribe + system prompt
  const createAndBindSession = async (profile: LlmProfile) => {
    const model = modelRegistryRef.current?.find(profile.provider, profile.model);
    if (!model) {
      throw new Error(`Model not found: ${profile.provider}/${profile.model}.`);
    }

    const { session } = await createAgentSession({
      sessionManager: sessionManagerRef.current,
      authStorage: authStorageRef.current,
      modelRegistry: modelRegistryRef.current,
      resourceLoader: resourceLoaderRef.current,
      model,
    });

    // Bind commandContextActions so extension handlers (ctx.newSession etc.) work
    await session.bindExtensions({
      commandContextActions: {
        waitForIdle: () => session.agent.waitForIdle(),
        newSession: async (_options?: any) => {
          if (handleNewSessionRef.current) {
            await handleNewSessionRef.current();
          }
          return { cancelled: false };
        },
        fork: async () => ({ cancelled: true }),
        navigateTree: async () => ({ cancelled: true }),
        switchSession: async () => ({ cancelled: true }),
        reload: async () => {},
      },
      onError: (error: any) => {
        dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `[Extension Error] ${error.message ?? error}` });
      },
    });

    sessionRef.current = session;

    subscribeSessionEvents(session, profile);

    const cfg = configRef.current!;
    const systemPrompt = buildSystemPrompt(cfg.workspace.language, cfg);
    await session.prompt(systemPrompt);
    suppressDisplayRef.current = false;
  };

  const initialize = useCallback(async () => {
    try {
      const loadedConfig = loadConfig();
      const cfgPath = findConfigFile();
      configPathRef.current = cfgPath;
      setConfig(loadedConfig);
      configRef.current = loadedConfig;

      const activeProfile = getActiveProfile(loadedConfig);
      setActiveProfileName(loadedConfig.llm.active ?? "default");

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
                api: profile.api_type ?? "openai-completions",
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

      // Legacy base_url
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

      await createAndBindSession(activeProfile);

      // Seed status bar with initial data
      const ctxWindow = activeProfile.context_window ?? 128_000;
      const mon = monitorRef.current;
      if (mon) {
        mon.record(
          { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
          { tokens: 0, contextWindow: ctxWindow, percent: 0 },
        );
        setMonitorData({ latest: mon.latest, cacheHitRate: mon.cacheHitRate, pressure: mon.pressure, totalRounds: mon.totalRounds });
      }

      setInitialized(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const resetSessionState = useCallback(() => {
    userMsgCountRef.current = 0;
    assistantMsgCountRef.current = 0;
    toolCallCountRef.current = 0;
    toolResultCountRef.current = 0;
    assistantSegmentClosedRef.current = false;
    setOutputCharCount(0);
    setAccumulatedTokens(0);

    const mon = monitorRef.current;
    if (mon) {
      mon.reset();
      const cfg = configRef.current;
      const profile = cfg ? getActiveProfile(cfg) : null;
      const ctxWindow = profile?.context_window ?? 128_000;
      mon.record(
        { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        { tokens: 0, contextWindow: ctxWindow, percent: 0 },
      );
      setMonitorData({ latest: mon.latest, cacheHitRate: mon.cacheHitRate, pressure: mon.pressure, totalRounds: mon.totalRounds });
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

  // handleNewSession — creates a brand new session, optionally sending a steer message
  const handleNewSession = useCallback(async (options?: { withSteer?: boolean }) => {
    const cfg = configRef.current;
    if (!cfg) return;

    const activeProfile = getActiveProfile(cfg);

    // Reset counters before creating new session
    resetSessionState();

    // Register provider if needed (may already be registered)
    if (activeProfile.base_url && activeProfile.api_key) {
      try {
        modelRegistryRef.current?.registerProvider(activeProfile.provider, {
          api: activeProfile.api_type ?? "openai-completions",
          baseUrl: activeProfile.base_url,
          apiKey: activeProfile.api_key,
          models: [{
            id: activeProfile.model,
            name: activeProfile.model,
            reasoning: false,
            input: ["text"],
            contextWindow: activeProfile.context_window ?? 128000,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            maxTokens: 8192,
          }],
        });
      } catch {
        // Provider may already be registered
      }
    }

    await createAndBindSession(activeProfile);

    // Send steer message for /clear (preserve capabilities hint)
    if (options?.withSteer && sessionRef.current) {
      await sessionRef.current.prompt("Context cleared. Ready for new conversation. You retain all system prompt capabilities.");
    }
  }, [resetSessionState]);

  // Keep ref in sync so commandContextActions.newSession can call it
  handleNewSessionRef.current = handleNewSession;

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

    cfg.llm.active = profileName;
    setActiveProfileName(profileName);

    // Register provider if needed
    if (profile.base_url && profile.api_key) {
      try {
        modelRegistryRef.current?.registerProvider(profile.provider, {
          api: profile.api_type ?? "openai-completions",
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

    await createAndBindSession(profile);

    // Persist active profile to edith.yaml
    const cfgPath = configPathRef.current;
    if (cfgPath) {
      saveActiveProfile(cfgPath, profileName);
    }

    return `Switched to ${profile.model} (${profileName})`;
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
    handleNewSession,
    resetSessionState,
    dispatch,
    thinkingDispatch,
    toolCallDispatch,
    toggleThinking,
    expandAllThinking,
    collapseAllThinking,
    monitorData,
    switchProfile,
    activeProfileName,
  };
}
