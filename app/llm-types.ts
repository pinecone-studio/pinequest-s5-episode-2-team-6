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

/** Per-chapter activity the teacher uses to pick its teaching depth. */
export interface TeacherTopicLevel {
  chapterId: string;
  questions: number;
  level: number;
}

/** Compact learning profile sent with each teacher turn. */
export interface TeacherStudentContext {
  topics: TeacherTopicLevel[];
  recentQuestions?: string[];
}

export interface AssistantChatRequest {
  messages: ChatTurn[];
  selection?: AssistantSelection | null;
  references?: AssistantReference[];
  /** 'teacher' selects the AI-teacher prompt; the default is the atlas assistant. */
  mode?: 'assistant' | 'teacher';
  /** Teacher mode: which Gray's chapter the question is anchored to. */
  textbook?: {chapterId?: string};
  /** Teacher mode: the saved learning profile of this student. */
  student?: TeacherStudentContext;
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
