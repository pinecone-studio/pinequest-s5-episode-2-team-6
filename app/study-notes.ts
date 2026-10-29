/** Saved structures and the student's own notes, kept in localStorage on this device.
 *  A structure is keyed by its atlas concept name, so a saved entry reopens the same concept from search. */

import {useSyncExternalStore} from 'react';

export interface StudyNote {
  saved: boolean;
  note: string;
  at: number;
}

type Notes = Record<string, StudyNote>;

const KEY = 'anatomn-study-notes';
const listeners = new Set<() => void>();
let notes: Notes = read();

function read(): Notes {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function write(next: Notes) {
  notes = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* Storage can be blocked; the change still holds for this visit. */
  }
  listeners.forEach(listener => listener());
}

function update(name: string, change: Partial<StudyNote>) {
  const current = notes[name] ?? {saved: false, note: '', at: 0};
  const next = {...current, ...change, at: Date.now()};
  const rest = {...notes};
  delete rest[name];
  write(next.saved || next.note.trim() ? {...rest, [name]: next} : rest);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab saving a note shows up here too.
  const storage = (e: StorageEvent) => {
    if (e.key === KEY) {
      notes = read();
      listener();
    }
  };
  addEventListener('storage', storage);
  return () => {
    listeners.delete(listener);
    removeEventListener('storage', storage);
  };
}

export function useStudyNotes() {
  const all = useSyncExternalStore(subscribe, () => notes, () => notes);
  return {
    get: (name: string): StudyNote | undefined => all[name],
    toggleSaved: (name: string) => update(name, {saved: !all[name]?.saved}),
    setNote: (name: string, note: string) => update(name, {note}),
    /** Saved or annotated structures, newest first. */
    list: Object.entries(all)
      .sort((a, b) => b[1].at - a[1].at)
      .map(([name, note]) => ({name, ...note})),
  };
}
