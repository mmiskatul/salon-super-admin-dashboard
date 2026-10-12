'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-runs the loader. Safe to call from an event handler after a mutation. */
  refresh: () => Promise<void>;
  /** Local override, for optimistic updates that don't warrant a round trip. */
  setData: (next: T | null) => void;
  /** True when a background revalidation is running even though cached data is displayed. */
  isFetching?: boolean;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Try again.';
}

/**
 * Loads on mount and caches server state via TanStack Query.
 *
 * When navigating between pages or switching routes, previously loaded data is served
 * INSTANTLY from memory cache without showing a full-page loading spinner.
 * In the background, a silent revalidation runs (stale-while-revalidate), and updates
 * the UI seamlessly whenever fresh data is available.
 */
export function useApi<T>(
  loader: () => Promise<T>,
  deps: unknown[],
  /** Names this data in the cache, with `deps`. Must differ for different loaders and match for
   *  the same one (e.g. 'tenants' for listTenants() on every page, so they share it). It used to
   *  default to the first 120 characters of the loader's compiled source, and two loaders calling
   *  different functions of one API file look identical that far (the long import prefix), so the
   *  wallet panel's entries list was handed the wallet object and showed "0 transactions". */
  key: string,
): AsyncState<T> {
  const queryClient = useQueryClient();
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  // One stable key per (key, deps) value; deps are plain values (ids, filters, page numbers).
  const keyHash = JSON.stringify([key, ...deps]);
  const queryKey = useMemo(
    () => ['useApi', key, ...deps],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keyHash],
  );

  const query = useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      return await loaderRef.current();
    },
    staleTime: 30_000, // Data remains fresh for 30s before background revalidation
    gcTime: 10 * 60_000, // Retain in memory for 10 minutes across page transitions
    refetchOnWindowFocus: true,
  });

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const setData = useCallback(
    (next: T | null) => {
      queryClient.setQueryData(queryKey, next);
    },
    [queryClient, queryKey],
  );

  return {
    data: query.data ?? null,
    // Only display full-page loading spinner when there is NO cached data at all
    loading: query.isLoading && query.data === undefined,
    error: query.error ? messageOf(query.error) : null,
    refresh,
    setData,
    isFetching: query.isFetching,
  };
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
