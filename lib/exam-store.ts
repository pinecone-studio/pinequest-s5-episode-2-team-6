// Exam, XP and student-profile data access.
//
// Everything here degrades to a `missing` state instead of throwing: the
// tables are created by supabase/schema.sql, and a deployment whose database
// has not been migrated yet must still render the app with a clear message
// rather than a blank screen. Postgres reports an absent table as SQLSTATE
// 42P01, and Supabase surfaces that as code '42P01' (sometimes 'PGRST205'); an
// absent function is 42883 or 'PGRST202'.
import {supabase} from './supabase';
import {QUIZ} from '../app/quiz/questions';
import {EXAM_GROUPS, groupOf} from './anatomy-groups';
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
  /** Anatomy group the paper belongs to — an atlas system id such as 'skeletal'. */
  group_key: string;
  /** The atlas structure the paper is written about, e.g. 'femur'. */
  part_key: string;
  /** Its Mongolian name, stored so titles need no extra lookup. */
  part_mn: string;
  /** 'ai' when the assistant drafted the questions, 'manual' when the team wrote them. */
  source: string;
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

const MISSING = new Set(['42P01', 'PGRST205', '42703', '42883', 'PGRST202']);

function stateOf(error: {code?: string; message?: string} | null): DbState {
  if (!error) return 'ok';
  const code = error.code ?? '';
  if (MISSING.has(code) || /does not exist|could not find the (table|function)|column .* does not exist/i.test(error.message ?? '')) return 'missing';
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
    data: exams.map(e => ({
      ...e,
      group_key: e.group_key ?? '',
      part_key: e.part_key ?? '',
      part_mn: e.part_mn ?? '',
      source: e.source ?? 'manual',
      question_count: tally.get(e.id)?.count ?? 0,
      total_points: tally.get(e.id)?.points ?? 0,
    })),
    state: 'ok',
  };
}

/** A section of the exam list: one anatomy group and the papers inside it. */
export interface ExamSection {
  /** Empty for papers written before the bank had groups; the page hides those. */
  groupKey: string;
  papers: Exam[];
}

/**
 * Split published papers into the anatomy groups of lib/anatomy-groups.ts.
 * Inside a group the papers follow the catalogue's own order, so the list on
 * /exam reads as a structured bank rather than a feed sorted by date.
 */
export function papersByGroup(exams: Exam[]): ExamSection[] {
  const buckets = new Map<string, Exam[]>();
  for (const paper of exams) {
    const key = groupOf(paper.group_key) ? paper.group_key : '';
    buckets.set(key, [...(buckets.get(key) ?? []), paper]);
  }
  const rank = (group: (typeof EXAM_GROUPS)[number], partKey: string) => {
    const index = group.parts.indexOf(partKey);
    return index < 0 ? group.parts.length : index;
  };
  const sections: ExamSection[] = EXAM_GROUPS
    .filter(group => (buckets.get(group.id)?.length ?? 0) > 0)
    .map(group => ({
      groupKey: group.id,
      papers: (buckets.get(group.id) ?? []).slice().sort((a, b) => rank(group, a.part_key) - rank(group, b.part_key)),
    }));
  const rest = buckets.get('') ?? [];
  if (rest.length) sections.push({groupKey: '', papers: rest});
  return sections;
}

export interface DraftPaperQuestion {
  kind: 'mcq' | 'case';
  prompt: string;
  prompt_en: string;
  options: string[];
  answer: number | null;
  rubric: string;
  points: number;
}

export interface DraftPaper {
  title: string;
  titleEn?: string;
  topic: string;
  groupKey?: string;
  partKey?: string;
  partMn?: string;
  source?: 'manual' | 'ai';
  timeLimitMin?: number;
  passPct?: number;
  questions: DraftPaperQuestion[];
}

/**
 * Store a reviewed draft as a paper students cannot see yet. The exam row and
 * its questions go in together; if the questions fail, the empty shell is
 * archived so no half paper can be published by accident.
 */
export async function saveDraftPaper(paper: DraftPaper): Promise<Result<number | null>> {
  if (!paper.questions.length) return {data: null, state: 'error', message: 'No questions to store.'};
  const {data: row, error: examError} = await supabase
    .from('exams')
    .insert({
      title: paper.title.slice(0, 120),
      title_en: (paper.titleEn ?? '').slice(0, 120),
      topic: paper.topic.slice(0, 120),
      level: 'basic',
      status: 'draft',
      time_limit_min: paper.timeLimitMin ?? 6,
      pass_pct: paper.passPct ?? 80,
      group_key: paper.groupKey ?? '',
      part_key: paper.partKey ?? '',
      part_mn: paper.partMn ?? '',
      source: paper.source ?? 'manual',
    })
    .select('id')
    .single();
  if (examError || !row) {
    console.error('[exam] draft paper insert failed', examError?.code, examError?.message);
    return {data: null, state: stateOf(examError), message: examError?.message};
  }
  const examId = Number(row.id);
  const {error: questionError} = await supabase.from('exam_questions').insert(
    paper.questions.map((question, index) => ({
      exam_id: examId,
      position: index + 1,
      kind: question.kind,
      prompt: question.prompt,
      prompt_en: question.prompt_en,
      options: question.options,
      answer: question.kind === 'mcq' ? question.answer : null,
      rubric: question.rubric,
      concept: paper.partKey ?? '',
      points: question.points,
    })),
  );
  if (questionError) {
    await supabase.from('exams').update({status: 'archived'}).eq('id', examId);
    console.error('[exam] draft questions failed', questionError.code, questionError.message);
    return {data: null, state: stateOf(questionError), message: questionError.message};
  }
  return {data: examId, state: 'ok'};
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
  const paper = (exam as Exam | null) ?? null;
  return {
    data: {
      exam: paper ? {...paper, group_key: paper.group_key ?? '', part_key: paper.part_key ?? '', part_mn: paper.part_mn ?? '', source: paper.source ?? 'manual'} : null,
      questions: (questions ?? []) as ExamQuestion[],
    },
    state: 'ok',
  };
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
  // An update that matches no row is not an error to PostgREST, so ask for the
  // row back: no row means nothing was saved (no profile yet, or RLS refused).
  const {data, error} = await supabase.from('profiles').update(fields).eq('id', userId).select('id');
  if (error) return {data: null, state: stateOf(error), message: error.message};
  if (!data?.length) return {data: null, state: 'error', message: 'No profile row was updated.'};
  return {data: null, state: 'ok'};
}

/** Points earned per day for the last seven days — the dashboard's bar chart. */
export function weeklyPoints(events: XpEvent[], lang: Lang): {label: string; points: number}[] {
  // Both sides use the visitor's local calendar day: created_at is UTC, and
  // slicing its date would file a morning in Ulaanbaatar under the day before.
  const dayKey = (day: Date) => `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  const byDay = new Map<string, number>();
  for (const event of events) {
    if (event.points <= 0) continue;
    const key = dayKey(new Date(event.created_at));
    byDay.set(key, (byDay.get(key) ?? 0) + event.points);
  }
  const labels = lang === 'mn' ? ['Ням', 'Дав', 'Мяг', 'Лха', 'Пүр', 'Баа', 'Бяа'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const out: {label: string; points: number}[] = [];
  const today = new Date();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    out.push({label: labels[day.getDay()], points: byDay.get(dayKey(day)) ?? 0});
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
    const details = result.details as {items?: unknown; answers?: Record<string, number>} | null;
    // Current rows say per question whether it was right; generated questions carry their own concept.
    if (Array.isArray(details?.items)) {
      for (const item of details.items as {concept?: unknown; correct?: unknown}[]) {
        const concept = typeof item?.concept === 'string' ? item.concept : '';
        add(concept, concept, item?.correct === true);
      }
      continue;
    }
    // Older rows keep the picked option by position in the original twelve, which still lead the bank.
    const answers = details?.answers;
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
