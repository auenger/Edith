export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "streaming" | "complete" | "error";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  timestamp: number;
}

export interface ToolCallInfo {
  toolCallId: string;
  toolName: string;
  status: "running" | "complete" | "error";
  summary?: string;
}

export interface ThinkingBlock {
  id: string;
  content: string;
  isStreaming: boolean;
  toolCalls: ToolCallInfo[];
  expanded: boolean;
  timestamp: number;
}

export type MessageAction =
  | { type: "ADD_USER_MESSAGE"; payload: string }
  | { type: "START_ASSISTANT_MESSAGE" }
  | { type: "APPEND_TO_ASSISTANT"; payload: string }
  | { type: "COMPLETE_ASSISTANT" }
  | { type: "ERROR_ASSISTANT"; payload: string }
  | { type: "ADD_SYSTEM_MESSAGE"; payload: string }
  | { type: "START_THINKING" }
  | { type: "APPEND_THINKING"; payload: string }
  | { type: "END_THINKING" }
  | { type: "START_TOOL_CALL"; payload: { toolCallId: string; toolName: string } }
  | { type: "END_TOOL_CALL"; payload: { toolCallId: string; summary: string; isError: boolean } }
  | { type: "TOGGLE_THINKING"; payload: string }
  | { type: "EXPAND_ALL_THINKING" }
  | { type: "COLLAPSE_ALL_THINKING" };

let messageCounter = 0;

export function createMessageId(): string {
  return `msg-${++messageCounter}-${Date.now()}`;
}

let thinkingCounter = 0;

export function createThinkingId(): string {
  return `think-${++thinkingCounter}-${Date.now()}`;
}

export function messageReducer(state: Message[], action: MessageAction): Message[] {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return [
        ...state,
        {
          id: createMessageId(),
          role: "user",
          content: action.payload,
          status: "complete",
          timestamp: Date.now(),
        },
      ];

    case "START_ASSISTANT_MESSAGE":
      return [
        ...state,
        {
          id: createMessageId(),
          role: "assistant",
          content: "",
          status: "streaming",
          timestamp: Date.now(),
        },
      ];

    case "APPEND_TO_ASSISTANT": {
      const idx = state.length - 1;
      if (idx < 0 || state[idx].role !== "assistant" || state[idx].status !== "streaming") {
        return state;
      }
      const updated = [...state];
      updated[idx] = { ...updated[idx], content: updated[idx].content + action.payload };
      return updated;
    }

    case "COMPLETE_ASSISTANT": {
      const idx = state.length - 1;
      if (idx < 0 || state[idx].role !== "assistant") {
        return state;
      }
      const updated = [...state];
      updated[idx] = { ...updated[idx], status: "complete" };
      return updated;
    }

    case "ERROR_ASSISTANT": {
      const idx = state.length - 1;
      if (idx < 0 || state[idx].role !== "assistant") {
        return state;
      }
      const updated = [...state];
      updated[idx] = {
        ...updated[idx],
        content: updated[idx].content + `\n[ERROR] ${action.payload}`,
        status: "error",
      };
      return updated;
    }

    case "ADD_SYSTEM_MESSAGE":
      return [
        ...state,
        {
          id: createMessageId(),
          role: "system",
          content: action.payload,
          status: "complete",
          timestamp: Date.now(),
        },
      ];

    default:
      return state;
  }
}

export function thinkingReducer(state: ThinkingBlock[], action: MessageAction): ThinkingBlock[] {
  switch (action.type) {
    case "START_THINKING":
      return [
        ...state,
        {
          id: createThinkingId(),
          content: "",
          isStreaming: true,
          toolCalls: [],
          expanded: false,
          timestamp: Date.now(),
        },
      ];

    case "APPEND_THINKING": {
      const idx = state.length - 1;
      if (idx < 0 || !state[idx].isStreaming) return state;
      const updated = [...state];
      updated[idx] = { ...updated[idx], content: updated[idx].content + action.payload };
      return updated;
    }

    case "END_THINKING": {
      const idx = state.length - 1;
      if (idx < 0) return state;
      const updated = [...state];
      updated[idx] = { ...updated[idx], isStreaming: false };
      return updated;
    }

    case "START_TOOL_CALL": {
      const idx = state.length - 1;
      if (idx < 0) return state;
      const updated = [...state];
      updated[idx] = {
        ...updated[idx],
        toolCalls: [
          ...updated[idx].toolCalls,
          {
            toolCallId: action.payload.toolCallId,
            toolName: action.payload.toolName,
            status: "running",
          },
        ],
      };
      return updated;
    }

    case "END_TOOL_CALL": {
      for (let i = state.length - 1; i >= 0; i--) {
        const tcIdx = state[i].toolCalls.findIndex(
          (tc) => tc.toolCallId === action.payload.toolCallId
        );
        if (tcIdx >= 0) {
          const updated = [...state];
          const toolCalls = [...updated[i].toolCalls];
          toolCalls[tcIdx] = {
            ...toolCalls[tcIdx],
            status: action.payload.isError ? "error" : "complete",
            summary: action.payload.summary,
          };
          updated[i] = { ...updated[i], toolCalls };
          return updated;
        }
      }
      return state;
    }

    case "TOGGLE_THINKING": {
      return state.map((tb) =>
        tb.id === action.payload ? { ...tb, expanded: !tb.expanded } : tb
      );
    }

    case "EXPAND_ALL_THINKING":
      return state.map((tb) => ({ ...tb, expanded: true }));

    case "COLLAPSE_ALL_THINKING":
      return state.map((tb) => ({ ...tb, expanded: false }));

    default:
      return state;
  }
}
