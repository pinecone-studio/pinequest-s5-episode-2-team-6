/** Vercel Function: /api/chat
 *
 * The shared handler lives in `server/chat.ts` so the Vite dev server can serve
 * the same endpoint locally without a second implementation. */

import {handleChatRequest} from '../server/chat';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

export function GET(request: Request): Promise<Response> {
  return handleChatRequest(request);
}

export function POST(request: Request): Promise<Response> {
  return handleChatRequest(request);
}

export function OPTIONS(): Response {
  return new Response(null, {status: 204, headers: {allow: 'GET, POST, OPTIONS'}});
}
