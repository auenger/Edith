export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "streaming" | "complete" | "error";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  timestamp: number;
}

export type MessageAction =
  | { type: "ADD_USER_MESSAGE"; payload: string }
  | { type: "START_ASSISTANT_MESSAGE" }
  | { type: "APPEND_TO_ASSISTANT"; payload: string }
  | { type: "COMPLETE_ASSISTANT" }
  | { type: "ERROR_ASSISTANT"; payload: string }
  | { type: "ADD_SYSTEM_MESSAGE"; payload: string };

let messageCounter = 0;

export function createMessageId(): string {
  return `msg-${++messageCounter}-${Date.now()}`;
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
