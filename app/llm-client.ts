/** Browser client for the streaming `/api/chat` endpoint. */

import type {AssistantChatRequest, AssistantErrorPayload, AssistantHealth} from './llm-types';

export class AssistantError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = 'AssistantError';
    this.code = code;
    this.status = status;
  }
}

interface StreamOptions {
  signal?: AbortSignal;
  onDelta: (text: string) => void;
}

interface StreamEvent {
  type?: 'delta' | 'done' | 'error';
  text?: string;
  message?: string;
}

async function errorFromResponse(response: Response): Promise<AssistantError> {
  let payload: AssistantErrorPayload | null = null;
  try {
    payload = (await response.json()) as AssistantErrorPayload;
  } catch {
    // The response may be HTML from a static host without the API function.
  }
  const code = payload?.error?.code ?? (response.status === 404 ? 'unavailable' : 'http_error');
  const message = payload?.error?.message ?? `The assistant endpoint returned HTTP ${response.status}.`;
  return new AssistantError(code, response.status, message);
}

/** Stream one assistant answer, calling `onDelta` for each text chunk. */
export async function streamAssistant(request: AssistantChatRequest, options: StreamOptions): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: {'content-type': 'application/json', accept: 'text/event-stream'},
      body: JSON.stringify(request),
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw new AssistantError('aborted', 0, 'Aborted');
    throw new AssistantError('network', 0, error instanceof Error ? error.message : 'Network error');
  }

  if (!response.ok) throw await errorFromResponse(response);

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream')) {
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as {text?: string};
      if (payload.text) {
        options.onDelta(payload.text);
        return;
      }
    }
    throw new AssistantError('unavailable', response.status, 'The assistant endpoint did not return an event stream.');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new AssistantError('empty', response.status, 'The assistant returned no stream.');

  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;

  const handleBlock = (block: string) => {
    const data = block
      .split('\n')
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trimStart())
      .join('\n');
    if (!data) return;
    let event: StreamEvent;
    try {
      event = JSON.parse(data) as StreamEvent;
    } catch {
      return;
    }
    if (event.type === 'delta' && typeof event.text === 'string') options.onDelta(event.text);
    else if (event.type === 'error') throw new AssistantError('stream_error', 200, event.message ?? 'The assistant stream failed.');
    else if (event.type === 'done') done = true;
  };

  try {
    while (true) {
      const {done: streamDone, value} = await reader.read();
      if (streamDone) break;
      // Normalize the whole buffer, not each chunk: a CRLF can be split
      // across two network chunks ("\r" then "\n").
      buffer = (buffer + decoder.decode(value, {stream: true})).replace(/\r\n/g, '\n');
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        handleBlock(block);
      }
    }
    buffer = (buffer + decoder.decode()).replace(/\r\n/g, '\n');
    if (buffer.trim()) handleBlock(buffer);
  } catch (error) {
    if (error instanceof AssistantError) throw error;
    if (options.signal?.aborted) throw new AssistantError('aborted', 0, 'Aborted');
    throw new AssistantError('network', 0, error instanceof Error ? error.message : 'Network error');
  } finally {
    reader.releaseLock();
  }

  if (!done) throw new AssistantError('stream_error', 200, 'The assistant stream ended unexpectedly.');
}

/** Read the provider badge / configuration status. */
export async function fetchAssistantHealth(signal?: AbortSignal): Promise<AssistantHealth> {
  let response: Response;
  try {
    response = await fetch('/api/chat', {headers: {accept: 'application/json'}, signal});
  } catch (error) {
    throw new AssistantError('network', 0, error instanceof Error ? error.message : 'Network error');
  }
  if (!response.ok) throw await errorFromResponse(response);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new AssistantError('unavailable', response.status, 'The assistant endpoint is not available.');
  }
  return (await response.json()) as AssistantHealth;
}
