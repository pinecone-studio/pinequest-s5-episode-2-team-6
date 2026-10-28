/** Server side of the exam module: /api/exam
 *
 * Two jobs, both of which need the model and neither of which the browser
 * should do:
 *   grade — score a student's free-text case answers against the rubric the
 *           team stored with the question.
 *   draft — write candidate questions for an admin to review. A draft never
 *           reaches a student until its exam row is published.
 *
 * Scores are clamped here and again in the database trigger, so a model that
 * hands out more points than a question is worth cannot inflate a grade.
 */

import {resolveLlmConfig, type LlmConfig, type LlmEnv} from './chat';

export interface CaseQuestion {
  id: number;
  prompt: string;
  rubric: string;
  points: number;
}

export interface GradeRequest {
  mode: 'grade';
  lang?: string;
  questions: CaseQuestion[];
  answers: Record<string, string>;
}

export interface DraftRequest {
  mode: 'draft';
  lang?: string;
  topic: string;
  count: number;
}

export interface GradedCase {
  id: number;
  points: number;
  comment: string;
}

export interface DraftQuestion {
  kind: 'mcq' | 'case';
  prompt: string;
  prompt_en: string;
  options: string[];
  answer: number | null;
  rubric: string;
  points: number;
}

const JSON_HEADERS = {'content-type': 'application/json; charset=utf-8'};

const GRADE_SYSTEM = `Та анагаахын анатомийн шалгалтын үнэлгээч багш.
Хариуг зөвхөн дүрслэгдсэн rubric-ээр шүүнэ. Rubric-т бичээгүй нэмэлт шаардлага тавихгүй, хэрэглэгчийн хариуд бичээгүй зүйлийг "зөв" гэж тооцохгүй.
Оноог 0-ээс асуултын онооны хооронд бүхэл тоогоор олгоно. Хариулт бүрт монгол хэлээр, нэг-хоёр өгүүлбэр тайлбар бичнэ.
Зөвхөн JSON объект буцаана: {"scores":[{"id":<тоо>,"points":<тоо>,"comment":"<монгол текст>"}],"summary":"<монгол 2-3 өгүүлбэр, дараа юуг давтахаг заана>"}`;

const DRAFT_SYSTEM = `Та анагаахын сургалтын асуулт зохиогч.
Өгөгдсөн сэдвээр бодит, стандарт анагаахын мэдлэг дээр тулгуурласан асуулт зохионо. Таамаг, баталгаажуулаагүй статистик, эмийн худалдааны нэр бичихгүй.
Олон сонголттой асуулт бүрт зөвхөн нэг зөв хариулт, 4 сонголт байна. "case" асуулт богино клиник байдал дүрсэлж, rubric-т бүтэн хариултын шаардлагыг тодорхой бичнэ.
prompt — монгол, prompt_en — англи. Бүх текст монгол/англи хэлээр, бусад хэлний үг холихгүй.
Зөвхөн JSON объект буцаана: {"questions":[{"kind":"mcq"|"case","prompt":"...","prompt_en":"...","options":["...","...","...","..."],"answer":<0..3 эсвэл null>,"rubric":"...","points":<тоо>}]}`;

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {status, headers: JSON_HEADERS});
}

/** Pull the first JSON object out of a reply that may carry prose or fences. */
export function parseJsonObject(raw: string): Record<string, unknown> | null {
  const text = raw.replace(/```json/gi, '```').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const value = JSON.parse(text.slice(start, end + 1)) as unknown;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function complete(config: LlmConfig, system: string, user: string, signal: AbortSignal): Promise<string> {
  if (config.provider === 'gemini') {
    const response = await fetch(`${config.baseUrl}/models/${encodeURIComponent(config.model)}:generateContent`, {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-goog-api-key': config.apiKey},
      body: JSON.stringify({
        systemInstruction: {parts: [{text: system}]},
        contents: [{role: 'user', parts: [{text: user}]}],
        generationConfig: {temperature: 0.2, maxOutputTokens: 2048},
      }),
      signal,
    });
    if (!response.ok) throw new Error(`provider ${response.status}`);
    const body = (await response.json()) as {candidates?: {content?: {parts?: {text?: string}[]}}[]};
    return (body.candidates?.[0]?.content?.parts ?? []).map(part => part.text ?? '').join('');
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: `Bearer ${config.apiKey}`},
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      max_tokens: 2048,
      messages: [{role: 'system', content: system}, {role: 'user', content: user}],
    }),
    signal,
  });
  if (!response.ok) throw new Error(`provider ${response.status}`);
  const body = (await response.json()) as {choices?: {message?: {content?: string}}[]};
  return body.choices?.[0]?.message?.content ?? '';
}

/** Ask for case scores; every returned number is clamped to the question's worth. */
export async function gradeCases(config: LlmConfig, request: GradeRequest, signal: AbortSignal) {
  const user = request.questions
    .map(question => {
      const answer = (request.answers[String(question.id)] ?? '').trim();
      return [
        `Асуулт id=${question.id} (${question.points} оног)`,
        `Бодлого: ${question.prompt}`,
        `Rubric: ${question.rubric || 'тодорхойруулаагүй'}`,
        `Хариулт: ${answer || '(хоосон)'}`,
      ].join('\n');
    })
    .join('\n\n');
  const raw = await complete(config, GRADE_SYSTEM, user, signal);
  const parsed = parseJsonObject(raw);
  const rows = Array.isArray(parsed?.scores) ? (parsed.scores as Record<string, unknown>[]) : [];
  const byId = new Map<number, GradedCase>();
  for (const row of rows) {
    const id = Number(row.id);
    if (!Number.isFinite(id)) continue;
    const question = request.questions.find(item => item.id === id);
    if (!question) continue;
    const points = Math.max(0, Math.min(question.points, Math.round(Number(row.points) || 0)));
    byId.set(id, {id, points, comment: String(row.comment ?? '').slice(0, 600)});
  }
  const scores = request.questions.map(question => byId.get(question.id) ?? {id: question.id, points: 0, comment: 'Хариулт үнэлэгдээгүй.'});
  const caseScore = scores.reduce((sum, score) => sum + score.points, 0);
  const caseMax = request.questions.reduce((sum, question) => sum + question.points, 0);
  return {scores, caseScore, caseMax, summary: String(parsed?.summary ?? '').slice(0, 1200)};
}

export async function draftQuestions(config: LlmConfig, request: DraftRequest, signal: AbortSignal): Promise<DraftQuestion[]> {
  const count = Math.max(1, Math.min(10, Math.round(request.count) || 5));
  const user = `Сэдэв: ${request.topic}\nАсуултын тоо: ${count} (дор хаяж нэг нь "case"). Нийт оноо ойролцоогоор ${count * 2} байна.`;
  const raw = await complete(config, DRAFT_SYSTEM, user, signal);
  const parsed = parseJsonObject(raw);
  const rows = Array.isArray(parsed?.questions) ? (parsed.questions as Record<string, unknown>[]) : [];
  return rows.slice(0, count).map(row => {
    const kind: DraftQuestion['kind'] = row.kind === 'case' ? 'case' : 'mcq';
    const options = Array.isArray(row.options) ? row.options.map(String).slice(0, 6) : [];
    const answer = Number.isInteger(Number(row.answer)) && Number(row.answer) >= 0 && Number(row.answer) < options.length ? Number(row.answer) : null;
    return {
      kind,
      prompt: String(row.prompt ?? '').slice(0, 1200),
      prompt_en: String(row.prompt_en ?? '').slice(0, 1200),
      options: kind === 'mcq' ? options : [],
      answer: kind === 'mcq' ? answer : null,
      rubric: String(row.rubric ?? '').slice(0, 1200),
      points: Math.max(1, Math.min(10, Math.round(Number(row.points) || 1))),
    };
  }).filter(row => row.prompt && (row.kind === 'case' || (row.options.length >= 2 && row.answer !== null)));
}

export async function handleExamRequest(request: Request, env: LlmEnv = process.env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: {allow: 'GET, POST, OPTIONS'}});
  }
  const config = resolveLlmConfig(env);
  if (request.method !== 'POST') {
    return json({ok: true, configured: Boolean(config), service: 'exam'});
  }
  if (!config) {
    return json({ok: false, error: 'no-llm', message: 'GEMINI_API_KEY is not configured on this deployment.'}, 500);
  }
  let body: GradeRequest | DraftRequest;
  try {
    body = (await request.json()) as GradeRequest | DraftRequest;
  } catch {
    return json({ok: false, error: 'bad-json', message: 'Request body is not JSON.'}, 400);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    if (body.mode === 'grade') {
      const questions = (Array.isArray(body.questions) ? body.questions : []).filter(q => Number.isFinite(Number(q.id))).slice(0, 20);
      if (!questions.length) return json({ok: false, error: 'no-questions', message: 'No case questions to grade.'}, 400);
      const result = await gradeCases(config, {...body, questions}, controller.signal);
      return json({ok: true, ...result});
    }
    if (body.mode === 'draft') {
      if (!String(body.topic ?? '').trim()) return json({ok: false, error: 'no-topic', message: 'Topic is required.'}, 400);
      const questions = await draftQuestions(config, body, controller.signal);
      return json({ok: true, questions});
    }
    return json({ok: false, error: 'bad-mode', message: 'mode must be grade or draft.'}, 400);
  } catch (error) {
    console.error('[exam] provider call failed', error instanceof Error ? error.message : error);
    return json({ok: false, error: 'provider', message: 'Үнэлгээ авахад алдаа гарлаа. Дахин оролдоно уу.'}, 502);
  } finally {
    clearTimeout(timer);
  }
}
