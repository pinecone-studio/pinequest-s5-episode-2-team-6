/** Vercel Function: /api/auth
 *
 * The shared handler lives in `server/auth.ts` so the Vite dev server can
 * serve the same signup and login locally. */

import {handleAuthRequest} from '../server/auth';

export const config = {
  runtime: 'nodejs',
  maxDuration: 15,
};

export function GET(request: Request): Promise<Response> {
  return handleAuthRequest(request);
}

export function POST(request: Request): Promise<Response> {
  return handleAuthRequest(request);
}

export function OPTIONS(request: Request): Promise<Response> {
  return handleAuthRequest(request);
}
