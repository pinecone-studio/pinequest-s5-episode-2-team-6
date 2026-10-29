/** Vercel Function: /api/exam
 *
 * The shared handler lives in `server/exam.ts` so the Vite dev server can
 * serve the same endpoint locally without a second implementation.
 *
 * The `.js` suffix is deliberate: Vercel transpiles this file to ESM and Node
 * resolves the specifier verbatim, so an extensionless import of a `.ts`
 * sibling fails with ERR_MODULE_NOT_FOUND and the function never loads. */

import {handleExamRequest} from '../server/exam.js';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

export function GET(request: Request): Promise<Response> {
  return handleExamRequest(request);
}

export function POST(request: Request): Promise<Response> {
  return handleExamRequest(request);
}

export function OPTIONS(): Response {
  return new Response(null, {status: 204, headers: {allow: 'GET, POST, OPTIONS'}});
}
