/** Vercel Function: /api/auth
 *
 * The shared handler lives in `server/auth.ts` so the Vite dev server can
 * serve the same signup and login locally.
 *
 * The `.js` suffix is deliberate: Vercel transpiles this file to ESM and Node
 * resolves the specifier verbatim, so an extensionless import of a `.ts`
 * sibling fails with ERR_MODULE_NOT_FOUND and the function never loads. */

import {handleAuthRequest} from '../server/auth.js';

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
