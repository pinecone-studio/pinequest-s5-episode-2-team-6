/** The teacher's memory of the student.
 *
 * Every answered question is tagged with its textbook chapter and saved to
 * localStorage, and — for a signed-in student with Supabase configured — to
 * the `teacher_questions` table so the history follows them across devices.
 * The merged history becomes a compact profile (questions per chapter, level
 * 1-3, recent questions) that is sent to the LLM with every new turn, which
 * is how the teacher "learns": later answers reference earlier ones and pick
 * their depth from the student's level.
 */

import {supabase, supabaseConfigured} from '../../lib/supabase';
import {CHAPTERS} from './textbook';

export interface TeacherTopicStat {
  chapterId: string;
  questions: number;
  /** 1 = first steps, 2 = building up, 3 = deep review. */
  level: 1 | 2 | 3;
  lastAt: number;
}

export interface TeacherEntry {
  chapterId: string;
  question: string;
  at: number;
}

export interface TeacherProfile {
  topics: Record<string, {questions: number; lastAt: number}>;
  recent: TeacherEntry[];
}

const STORAGE_KEY = 'anatomn-teacher-profile';
const RECENT_MAX = 40;
/** Question counts at which the level of a chapter rises. */
const LEVEL_STEPS = [5, 12];

export function levelFor(questions: number): 1 | 2 | 3 {
  return questions >= LEVEL_STEPS[1] ? 3 : questions >= LEVEL_STEPS[0] ? 2 : 1;
}

export function levelLabel(level: 1 | 2 | 3): string {
  return level === 3 ? 'Гүнзгийрүүлсэн' : level === 2 ? 'Ахисан' : 'Эхлэл';
}

function emptyProfile(): TeacherProfile {
  return {topics: {}, recent: []};
}

/** The saved history, read back defensively against older or broken payloads. */
export function loadLocalProfile(): TeacherProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<TeacherProfile>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.topics !== 'object' || !Array.isArray(parsed.recent)) {
      return emptyProfile();
    }
    const topics: TeacherProfile['topics'] = {};
    const known = new Set(CHAPTERS.map(chapter => chapter.id));
    for (const [id, value] of Object.entries(parsed.topics as TeacherProfile['topics'])) {
      if (!known.has(id) || !value || typeof value.questions !== 'number' || typeof value.lastAt !== 'number') continue;
      topics[id] = {questions: Math.max(0, Math.floor(value.questions)), lastAt: value.lastAt};
    }
    const recent = parsed.recent
      .filter((item): item is TeacherEntry => !!item && typeof item.chapterId === 'string' && typeof item.question === 'string' && typeof item.at === 'number')
      .filter(item => known.has(item.chapterId) && item.question.trim())
      .slice(0, RECENT_MAX);
    return {topics, recent};
  } catch {
    // Blocked storage or a broken payload: a fresh profile is fine.
    return emptyProfile();
  }
}

export function saveLocalProfile(profile: TeacherProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage can be full or blocked; the session keeps working without it.
  }
}

export function recordQuestion(profile: TeacherProfile, chapterId: string, question: string): TeacherProfile {
  const topics = {...profile.topics};
  const current = topics[chapterId] ?? {questions: 0, lastAt: 0};
  topics[chapterId] = {questions: current.questions + 1, lastAt: Date.now()};
  const recent = [{chapterId, question, at: Date.now()}, ...profile.recent.filter(entry => entry.question !== question)].slice(0, RECENT_MAX);
  return {topics, recent};
}

/** Per-chapter stats with levels, ordered by activity. */
export function topicStats(profile: TeacherProfile): TeacherTopicStat[] {
  return Object.entries(profile.topics)
    .map(([chapterId, value]) => ({chapterId, questions: value.questions, level: levelFor(value.questions), lastAt: value.lastAt}))
    .sort((a, b) => b.questions - a.questions || b.lastAt - a.lastAt);
}

interface ServerRow {
  chapter_id?: string;
  question?: string;
  created_at?: string;
}

/** Merge cross-device history into the local profile (inserts only; nothing is deleted). */
export function mergeServerHistory(profile: TeacherProfile, rows: ServerRow[] | null): TeacherProfile {
  if (!Array.isArray(rows)) return profile;
  const known = new Set(CHAPTERS.map(chapter => chapter.id));
  const topics = {...profile.topics};
  const seen = new Set(profile.recent.map(entry => entry.question));
  const recent = [...profile.recent];
  for (const row of rows) {
    if (!row || typeof row.chapter_id !== 'string' || typeof row.question !== 'string' || !known.has(row.chapter_id)) continue;
    const question = row.question.trim();
    if (!question) continue;
    const at = row.created_at ? Date.parse(row.created_at) : 0;
    if (!topics[row.chapter_id]) topics[row.chapter_id] = {questions: 0, lastAt: 0};
    topics[row.chapter_id]!.questions += 1;
    topics[row.chapter_id]!.lastAt = Math.max(topics[row.chapter_id]!.lastAt, Number.isFinite(at) ? at : 0);
    if (!seen.has(question)) {
      seen.add(question);
      recent.push({chapterId: row.chapter_id, question, at: Number.isFinite(at) ? at : 0});
    }
  }
  recent.sort((a, b) => b.at - a.at);
  return {topics, recent: recent.slice(0, RECENT_MAX)};
}

/** Last questions for the signed-in student, or null when Supabase is off. */
export async function fetchServerHistory(): Promise<ServerRow[] | null> {
  if (!supabaseConfigured) return null;
  try {
    const {data, error} = await supabase.from('teacher_questions').select('chapter_id,question,created_at').order('created_at', {ascending: false}).limit(50);
    if (error) return null;
    return data as ServerRow[];
  } catch {
    return null;
  }
}

/** Fire-and-forget save of one asked question; failures stay silent. */
export async function saveServerQuestion(chapterId: string, question: string): Promise<void> {
  if (!supabaseConfigured) return;
  try {
    await supabase.from('teacher_questions').insert({chapter_id: chapterId, question});
  } catch {
    // The table may not exist yet (schema not run) or the student is offline.
  }
}
