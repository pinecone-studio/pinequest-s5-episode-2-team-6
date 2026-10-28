// Exam, XP and student-profile data access.
//
// Everything here degrades to a `missing` state instead of throwing: the
// tables are created by supabase/schema.sql, and a deployment whose database
// has not been migrated yet must still render the app with a clear message
// rather than a blank screen. Postgres reports an absent table as SQLSTATE
// 42P01, and Supabase surfaces that as code '42P01' (sometimes 'PGRST205').
import {supabase} from './supabase';
import {QUIZ} from '../app/quiz/questions';
import type {Lang} from '../app/landing/copy';

export type DbState = 'ok' | 'missing' | 'error';

export interface Exam {
  id: number;
  title: string;
  title_en: string;
  topic: string;
  level: string;
  time_limit_min: number;
  pass_pct: number;
  status: string;
  question_count?: number;
  total_points?: number;
}

export interface ExamQuestion {
  id: number;
  exam_id: number;
  position: number;
  kind: 'mcq' | 'case';
  prompt: string;
  prompt_en: string;
  options: string[];
  answer: number | null;
  rubric: string;
  concept: string;
  points: number;
}

export interface ExamAttempt {
  id: number;
  exam_id: number;
  user_id: string;
  answers: Record<string, {choice?: number; text?: string}>;
  mcq_score: number;
  case_score: number;
  case_max: number;
  total_points: number;
  score_pct: number;
  passed: boolean;
  ai_feedback: string;
  xp_awarded: number;
  duration_sec: number;
  created_at: string;
}

export interface XpEvent {
  id: number;
  kind: string;
  points: number;
  day: string;
  note: string;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  university: string;
  department: string;
  study_year: number;
  specialty: string;
}

export interface WeakTopic {
  label: string;
  correct: number;
  total: number;
  /** The atlas concept to focus on; empty when the row is an exam paper rather than a structure. */
  concept: string;
}

const MISSING = new Set(['42P01', 'PGRST205', '42703']);

function stateOf(error: {code?: string; message?: string} | null): DbState {
  if (!error) return 'ok';
  const code = error.code ?? '';
  if (MISSING.has(code) || /does not exist|could not find the table|column .* does not exist/i.test(error.message ?? '')) return 'missing';
  return 'error';
}

export interface Result<T> {
  data: T;
  state: DbState;
  message?: string;
}

/** Published papers, newest first, with how many questions each one holds. */
export async function fetchExams(): Promise<Result<Exam[]>> {
  const {data, error} = await supabase.from('exams').select('*').eq('status', 'published').order('created_at', {ascending: false});
  if (error) return {data: [], state: stateOf(error), message: error.message};
  const exams = (data ?? []) as Exam[];
  if (!exams.length) return {data: [], state: 'ok'};
  const ids = exams.map(e => e.id);
  const {data: questions} = await supabase.from('exam_questions').select('exam_id,points').in('exam_id', ids);
  const tally = new Map<number, {count: number; points: number}>();
  for (const row of (questions ?? []) as {exam_id: number; points: number}[]) {
    const entry = tally.get(row.exam_id) ?? {count: 0, points: 0};
    entry.count += 1;
    entry.points += row.points;
    tally.set(row.exam_id, entry);
  }
  return {
    data: exams.map(e => ({...e, question_count: tally.get(e.id)?.count ?? 0, total_points: tally.get(e.id)?.points ?? 0})),
    state: 'ok',
  };
}

/** One paper with its questions, ordered. Draft papers stay invisible to students. */
export async function fetchExam(id: number): Promise<Result<{exam: Exam | null; questions: ExamQuestion[]}>> {
  const empty = {exam: null, questions: [] as ExamQuestion[]};
  const [{data: exam, error}, {data: questions, error: qError}] = await Promise.all([
    supabase.from('exams').select('*').eq('id', id).maybeSingle(),
    supabase.from('exam_questions').select('*').eq('exam_id', id).order('position').order('id'),
  ]);
  const state = stateOf(error) === 'missing' || stateOf(qError) === 'missing' ? 'missing' : 'ok';
  if (state === 'missing') return {data: empty, state: 'missing'};
  return {data: {exam: (exam as Exam | null) ?? null, questions: (questions ?? []) as ExamQuestion[]}, state: 'ok'};
}

export async function fetchMyAttempts(): Promise<Result<ExamAttempt[]>> {
  const {data, error} = await supabase.from('exam_attempts').select('*').order('created_at', {ascending: false}).limit(100);
  if (error) return {data: [], state: stateOf(error), message: error.message};
  return {data: (data ?? []) as ExamAttempt[], state: 'ok'};
}

/**
 * Hand an attempt in. Only the answers and the model's case score travel;
 * the database trigger recomputes every multiple-choice point, the total,
 * the pass flag and the XP award, so the numbers shown come from the server.
 */
export async function submitAttempt(input: {
  examId: number;
  userId: string;
  answers: Record<string, {choice?: number; text?: string}>;
  caseScore: number;
  aiFeedback: string;
  durationSec: number;
}): Promise<Result<ExamAttempt | null>> {
  const {data, error} = await supabase
    .from('exam_attempts')
    .insert({
      exam_id: input.examId,
      user_id: input.userId,
      answers: input.answers,
      case_score: input.caseScore,
      ai_feedback: input.aiFeedback,
      duration_sec: input.durationSec,
    })
    .select()
    .single();
  if (error) {
    console.error('[exam] submit failed', error.code, error.message);
    return {data: null, state: stateOf(error), message: error.message};
  }
  return {data: data as ExamAttempt, state: 'ok'};
}

export async function fetchXp(): Promise<Result<{total: number; events: XpEvent[]; days: number}>> {
  const empty = {total: 0, events: [] as XpEvent[], days: 0};
  const {data: total, error: totalError} = await supabase.rpc('my_xp');
  if (stateOf(totalError) === 'missing') return {data: empty, state: 'missing'};
  const {data, error} = await supabase.from('xp_events').select('*').order('created_at', {ascending: false}).limit(200);
  if (error) return {data: {total: Number(total) || 0, events: [], days: 0}, state: stateOf(error), message: error.message};
  const events = (data ?? []) as XpEvent[];
  const days = new Set(events.filter(e => e.kind === 'checkin').map(e => e.day)).size;
  return {data: {total: Number(total) || 0, events, days}, state: 'ok'};
}

/** Today's attendance. Returns the new balance, or null when it is already claimed. */
export async function claimCheckin(): Promise<{total: number | null; state: DbState; message?: string}> {
  const {data, error} = await supabase.rpc('claim_daily_checkin');
  if (error) return {total: null, state: stateOf(error), message: error.message};
  return {total: Number(data) || 0, state: 'ok'};
}

export async function fetchProfile(userId: string): Promise<Result<StudentProfile | null>> {
  const {data, error} = await supabase
    .from('profiles')
    .select('id,name,email,is_admin,university,department,study_year,specialty')
    .eq('id', userId)
    .maybeSingle();
  if (error) return {data: null, state: stateOf(error), message: error.message};
  const row = (data ?? null) as StudentProfile | null;
  if (!row) return {data: null, state: 'ok'};
  return {data: {...row, university: row.university ?? '', department: row.department ?? '', specialty: row.specialty ?? '', study_year: Number(row.study_year) || 0}, state: 'ok'};
}

export async function saveProfile(userId: string, fields: Pick<StudentProfile, 'university' | 'department' | 'study_year' | 'specialty'>): Promise<Result<null>> {
  const {error} = await supabase.from('profiles').update(fields).eq('id', userId);
  if (error) return {data: null, state: stateOf(error), message: error.message};
  return {data: null, state: 'ok'};
}

/** Points earned per day for the last seven days — the dashboard's bar chart. */
export function weeklyPoints(events: XpEvent[], lang: Lang): {label: string; points: number}[] {
  const byDay = new Map<string, number>();
  for (const event of events) {
    if (event.points <= 0) continue;
    const key = event.created_at.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + event.points);
  }
  const labels = lang === 'mn' ? ['Ням', 'Дав', 'Мяг', 'Лха', 'Пүр', 'Баа', 'Бяа'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const out: {label: string; points: number}[] = [];
  const today = new Date();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today.getTime() - offset * 86400000);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    out.push({label: labels[day.getDay()], points: byDay.get(key) ?? 0});
  }
  return out;
}

/**
 * What to study next: the topics with the lowest hit rate, from the student's
 * own exam attempts and quiz history. Quiz concepts come from the static bank,
 * so this never has to download the 3D catalogue.
 */
export function weakTopics(attempts: ExamAttempt[], exams: Exam[], quizResults: {details: unknown}[], lang: Lang): WeakTopic[] {
  const tally = new Map<string, WeakTopic>();
  const add = (label: string, concept: string, correct: boolean) => {
    if (!label) return;
    const entry = tally.get(label) ?? {label, concept, correct: 0, total: 0};
    entry.total += 1;
    if (correct) entry.correct += 1;
    tally.set(label, entry);
  };
  const examTitle = new Map(exams.map(e => [e.id, lang === 'mn' ? e.title : e.title_en || e.title]));
  for (const attempt of attempts) {
    const title = examTitle.get(attempt.exam_id);
    if (!title) continue;
    add(title, '', attempt.passed);
  }
  for (const result of quizResults) {
    const answers = (result.details as {answers?: Record<string, number>} | null)?.answers;
    if (!answers) continue;
    for (const [key, picked] of Object.entries(answers)) {
      const index = Number(key);
      const question = QUIZ[index];
      if (!question) continue;
      add(question.concept, question.concept, question.answer === picked);
    }
  }
  return [...tally.values()]
    .filter(entry => entry.correct < entry.total)
    .sort((a, b) => a.correct / a.total - b.correct / b.total || b.total - a.total)
    .slice(0, 4);
}

export async function fetchQuizResults(userId: string): Promise<Result<{details: unknown}[]>> {
  const {data, error} = await supabase.from('quiz_results').select('details').eq('user_id', userId).order('created_at', {ascending: false}).limit(60);
  if (error) return {data: [], state: stateOf(error), message: error.message};
  return {data: (data ?? []) as {details: unknown}[], state: 'ok'};
}

/** The XP the checkout may offer: 1 XP = 5₮, never more than 20% of the price. */
export function maxDiscountMnt(balance: number, priceMnt: number): number {
  const byBalance = Math.max(0, balance) * 5;
  return Math.min(byBalance, Math.floor(priceMnt * 0.2));
}
