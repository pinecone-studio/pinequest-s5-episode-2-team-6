import {useCallback, useEffect, useState} from 'react';

export interface FetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

interface Answer<T> {
  url: string;
  attempt: number;
  data: T | null;
  error: Error | null;
}

/**
 * GETs `url` as JSON. A new url or a reload aborts the request it replaces, and nothing is set
 * once the request is aborted or the component unmounts. An empty or null url fetches nothing.
 */
export function useFetch<T>(url: string | null): FetchResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<Answer<T> | null>(null);

  useEffect(() => {
    if (!url) return;
    const abort = new AbortController();
    const settle = (data: T | null, error: Error | null) => {
      if (!abort.signal.aborted) setAnswer({url, attempt, data, error});
    };
    fetch(url, {headers: {accept: 'application/json'}, signal: abort.signal})
      .then(response => {
        if (!response.ok) throw new Error(`${url} answered ${response.status}`);
        return response.json() as Promise<T>;
      })
      .then(
        data => settle(data, null),
        (error: unknown) => settle(null, error instanceof Error ? error : new Error(String(error))),
      );
    return () => abort.abort();
  }, [url, attempt]);

  const reload = useCallback(() => setAttempt(n => n + 1), []);

  // An answer for another url is never shown; a reload keeps the last data until the new answer lands.
  const current = answer?.url === url ? answer : null;
  const loading = !!url && current?.attempt !== attempt;
  return {data: current?.data ?? null, loading, error: loading ? null : (current?.error ?? null), reload};
}
