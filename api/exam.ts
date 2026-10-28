/** Vercel Function: /api/exam
 *
 * The shared handler lives in `server/exam.ts` so the Vite dev server can
 * serve the same endpoint locally without a second implementation. */

import {handleExamRequest} from '../server/exam';

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
