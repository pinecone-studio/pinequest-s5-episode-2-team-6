/** Vercel Function: /api/chat
 *
 * The shared handler lives in `server/chat.ts` so the Vite dev server can serve
 * the same endpoint locally without a second implementation.
 *
 * The `.js` suffix is not a typo: Vercel transpiles this file to ESM and Node
 * then resolves the specifier verbatim, so an extensionless import of a `.ts`
 * sibling fails with ERR_MODULE_NOT_FOUND and the function never loads. */

import {handleChatRequest} from '../server/chat.js';

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
