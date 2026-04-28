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
import { messageReducer } from "./types.js";
import type { Message } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface AgentSessionState {
  messages: Message[];
  isProcessing: boolean;
  initialized: boolean;
  error: string | null;
  config: EdithConfig | null;
  sendUserMessage: (text: string) => Promise<void>;
}

export function useAgentSession(): AgentSessionState {
  const [messages, dispatch] = useReducer(messageReducer, []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<EdithConfig | null>(null);

  const sessionRef = useRef<any>(null);

  const initialize = useCallback(async () => {
    try {
      const loadedConfig = loadConfig();
      setConfig(loadedConfig);

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
        if (event.type === "message_update") {
          if (event.assistantMessageEvent.type === "text_delta") {
            dispatch({ type: "APPEND_TO_ASSISTANT", payload: event.assistantMessageEvent.delta });
          }
        }
        if (event.type === "agent_end") {
          dispatch({ type: "COMPLETE_ASSISTANT" });
          setIsProcessing(false);
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

  const initStartedRef = useRef(false);

  useEffect(() => {
    if (!initStartedRef.current) {
      initStartedRef.current = true;
      initialize();
    }
  }, [initialize]);

  return {
    messages,
    isProcessing,
    initialized,
    error,
    config,
    sendUserMessage,
  };
}
