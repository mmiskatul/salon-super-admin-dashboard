'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-runs the loader. Safe to call from an event handler after a mutation. */
  refresh: () => Promise<void>;
  /** Local override, for optimistic updates that don't warrant a round trip. */
  setData: (next: T | null) => void;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Try again.';
}

/**
 * Loads on mount and whenever `deps` change.
 *
 * The loader is held in a ref rather than being an effect dependency: these are written inline
 * (`useApi(() => listTenants(), [])`), so a fresh function identity arrives on every render and
 * depending on it directly would re-fetch forever.
 */
export function useApi<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loaderRef = useRef(loader);

  // Guards a slow first request resolving after a newer one, and setting state on an unmounted
  // component when the operator navigates away mid-flight.
  const runIdRef = useRef(0);
  const mountedRef = useRef(true);

  // Declared before the fetch effect below so it is committed first on any render that changes
  // both: effects fire in declaration order, so the loader is always current by the time the
  // fetch effect reads it. Writing the ref during render instead would be a render side effect.
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current();
      if (!mountedRef.current || runIdRef.current !== runId) return;
      setData(result);
    } catch (err) {
      if (!mountedRef.current || runIdRef.current !== runId) return;
      setError(messageOf(err));
    } finally {
      if (mountedRef.current && runIdRef.current === runId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // `run` enters the loading state synchronously, which is this effect's purpose: fetching
    // on mount and on every dependency change. The lint rule below targets derived state,
    // which this is not.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refresh: run, setData };
}

/**
 * Wraps a mutation with its own pending/error state, so a form can disable its submit control and
 * surface a failure without every caller repeating the same try/catch.
 */
export function useMutation<Args extends unknown[], R>(fn: (...args: Args) => Promise<R>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const mutate = useCallback(async (...args: Args): Promise<R | null> => {
    setPending(true);
    setError(null);
    try {
      return await fnRef.current(...args);
    } catch (err) {
      setError(messageOf(err));
      return null;
    } finally {
      setPending(false);
    }
  }, []);

  return { mutate, pending, error, clearError: useCallback(() => setError(null), []) };
}
