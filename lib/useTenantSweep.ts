'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { listTenants, type Tenant } from './api/tenants';

export interface SweepRow<T> {
  row: T;
  tenant: Tenant;
}

export interface SweepState<T> {
  tenants: Tenant[] | null;
  rows: SweepRow<T>[];
  loading: boolean;
  error: string | null;
  /** Shops whose request failed. The rows below are short by whatever those hold. */
  failedShops: number;
  reload: () => void;
}

/**
 * Load the roster, then ask every shop the same question.
 *
 * The shape shared by the Bookings and Payments screens, and the shape forced by the backend:
 * `GET /appointments` and `GET /transactions` are both scoped to one shop, so a platform-wide view
 * of either is the roster fanned out and flattened. Keeping it here rather than in each page means
 * the roster fetch, the partial-failure accounting and the stale-run guard exist once.
 *
 * A failed shop is counted, never dropped silently — a page that shows "no payments today" when
 * three shops did not answer is telling the operator something untrue.
 */
export function useTenantSweep<T>(
  fetcher: (tenant: Tenant) => Promise<T[]>,
  deps: unknown[] = [],
): SweepState<T> {
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [rows, setRows] = useState<SweepRow<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedShops, setFailedShops] = useState(0);
  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  const runRef = useRef(0);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    const runId = runRef.current + 1;
    runRef.current = runId;
    const live = () => runRef.current === runId;

    // Entering the loading state is the point of this effect: it synchronises with an external
    // system (the API) on mount and on every dependency change. The lint rule below targets
    // derived state, which this is not.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setRows([]);
    setFailedShops(0);

    (async () => {
      let roster: Tenant[];
      try {
        roster = await listTenants();
      } catch (err) {
        if (!live()) return;
        setError(err instanceof Error ? err.message : 'Could not load the shop roster.');
        setLoading(false);
        return;
      }
      if (!live()) return;
      setTenants(roster);

      const results = await Promise.allSettled(
        roster.map(async (tenant) => {
          const list = await fetcherRef.current(tenant);
          return list.map((row) => ({ row, tenant }));
        }),
      );
      if (!live()) return;

      const collected: SweepRow<T>[] = [];
      let failures = 0;
      for (const result of results) {
        if (result.status === 'fulfilled') collected.push(...result.value);
        else failures += 1;
      }

      setRows(collected);
      setFailedShops(failures);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { tenants, rows, loading, error, failedShops, reload };
}
