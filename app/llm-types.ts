/** Shared types for the LLM-backed atlas assistant.
 *
 * These types are used by both the browser chat panel and the server-side
 * `/api/chat` endpoint. They contain no runtime code, so the server can import
 * them without pulling React or the 3D viewer into the function bundle. */

export interface AssistantSelection {
  name: string;
  system: string;
  conceptId: string;
  elements: string[];
  latin?: string;
  overview?: string;
  function?: string;
  nerve?: string;
}

export interface AssistantReference {
  name: string;
  latin?: string;
  system?: string;
  overview?: string;
  function?: string;
  nerve?: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatRequest {
  messages: ChatTurn[];
  selection?: AssistantSelection | null;
  references?: AssistantReference[];
}

export interface AssistantHealth {
  configured: boolean;
  provider: string | null;
  model: string | null;
  hint?: string;
}

export interface AssistantErrorPayload {
  error: {
    code: string;
    message: string;
  };
}
