/** Local account store for /api/auth.
 *
 * Login used to pretend it succeeded and send the visitor onward with no
 * session, so the account page bounced them straight back to /login. This
 * handler records the person who signed up and gives them a session cookie
 * the rest of the app can read. */

import {randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';
import {mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';

const COOKIE = 'anatomn_session';
const MONTH = 60 * 60 * 24 * 30;
const JSON_HEADERS = {'content-type': 'application/json; charset=utf-8'};

interface StoredUser {
  id: string;
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

interface StoredSession {
  token: string;
  userId: string;
  expiresAt: number;
}

interface Store {
  users: StoredUser[];
  sessions: StoredSession[];
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

// Vercel's /tmp is per instance and wiped on cold starts, so this store only
// holds up for local development. Deployed builds sign up through Supabase
// instead: `.env.production` sets the VITE_SUPABASE_* values for them.
const file =
  process.env.AUTH_STORE_PATH ||
  (process.env.VERCEL ? join('/tmp', 'anatomn-auth-users.json') : join(process.cwd(), 'data', 'auth-users.json'));

let chain: Promise<unknown> = Promise.resolve();

function locked<T>(fn: () => T | Promise<T>): Promise<Awaited<T>> {
  const run = chain.then(fn, fn) as Promise<Awaited<T>>;
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function empty(): Store {
  return {users: [], sessions: []};
}

function readStore(): Store {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Store;
    if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.sessions)) return empty();
    return parsed;
  } catch {
    return empty();
  }
}

function writeStore(store: Store) {
  mkdirSync(dirname(file), {recursive: true});
  const next = `${file}.tmp`;
  writeFileSync(next, JSON.stringify(store));
  renameSync(next, file);
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString('hex');
}

function passwordMatches(password: string, user: StoredUser): boolean {
  const next = Buffer.from(hashPassword(password, user.salt), 'hex');
  const prev = Buffer.from(user.passwordHash, 'hex');
  return next.length === prev.length && timingSafeEqual(next, prev);
}

function publicUser(user: StoredUser): PublicUser {
  return {id: user.id, email: user.email, name: user.name};
}

function json(payload: unknown, status = 200, cookie?: string): Response {
  const headers = new Headers(JSON_HEADERS);
  if (cookie) headers.append('set-cookie', cookie);
  return new Response(JSON.stringify(payload), {status, headers});
}

function sessionCookie(token: string, request: Request, maxAge: number): string {
  const secure = new URL(request.url).protocol === 'https:';
  return [
    `${COOKIE}=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

function tokenFrom(request: Request): string {
  const header = request.headers.get('cookie') ?? '';
  const match = header.match(/(?:^|;\s*)anatomn_session=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
}

function liveSession(store: Store, token: string): StoredSession | null {
  if (!token) return null;
  const now = Date.now();
  store.sessions = store.sessions.filter(session => session.expiresAt > now);
  return store.sessions.find(session => session.token === token) ?? null;
}

async function bodyOf(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = (await request.json()) as unknown;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Register, sign in, sign out, or read the current session.
 *  `/api/auth` is the deployed path; a trailing action is accepted too. */
export function handleAuthRequest(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return Promise.resolve(new Response(null, {status: 204, headers: {allow: 'GET, POST, OPTIONS'}}));
  }
  if (request.method === 'GET') return locked(() => readSession(request));
  if (request.method !== 'POST') return Promise.resolve(json({error: 'method'}, 405));
  return locked(() => post(request));
}

async function post(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const body = await bodyOf(request);
  const fromPath = url.pathname.replace(/^\/api\/auth\/?/, '');
  const action = fromPath && fromPath !== 'auth' ? fromPath : text(body.action);
  if (action === 'signup') return signUp(body, request);
  if (action === 'login') return signIn(body, request);
  if (action === 'logout') return signOut(request);
  return json({error: 'not_found'}, 404);
}

function readSession(request: Request): Response {
  const store = readStore();
  const session = liveSession(store, tokenFrom(request));
  writeStore(store);
  const user = session ? store.users.find(row => row.id === session.userId) : null;
  return json({user: user ? publicUser(user) : null});
}

function signUp(body: Record<string, unknown>, request: Request): Response {
  const name = text(body.name);
  const email = text(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!name || !email || !password) return json({error: 'missing'}, 400);
  if (password.length < 8) return json({error: 'short'}, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({error: 'email'}, 400);

  const store = readStore();
  if (store.users.some(user => user.email === email)) return json({error: 'taken'}, 409);

  const salt = randomBytes(16).toString('hex');
  const user: StoredUser = {
    id: randomBytes(16).toString('hex'),
    name,
    email,
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  const session = openSession(store, user.id);
  writeStore(store);
  return json({user: publicUser(user)}, 201, sessionCookie(session.token, request, MONTH));
}

function signIn(body: Record<string, unknown>, request: Request): Response {
  const email = text(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) return json({error: 'missing'}, 400);

  const store = readStore();
  const user = store.users.find(row => row.email === email);
  if (!user || !passwordMatches(password, user)) return json({error: 'invalid'}, 401);
  const session = openSession(store, user.id);
  writeStore(store);
  return json({user: publicUser(user)}, 200, sessionCookie(session.token, request, MONTH));
}

function signOut(request: Request): Response {
  const store = readStore();
  const token = tokenFrom(request);
  store.sessions = store.sessions.filter(session => session.token !== token);
  writeStore(store);
  return json({ok: true}, 200, sessionCookie('', request, 0));
}

function openSession(store: Store, userId: string): StoredSession {
  const session: StoredSession = {
    token: randomBytes(32).toString('hex'),
    userId,
    expiresAt: Date.now() + MONTH * 1000,
  };
  store.sessions.push(session);
  return session;
}
