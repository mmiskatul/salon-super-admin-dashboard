'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { listTenants, type Tenant } from './api/tenants';
import {
  fetchPlatformVitals,
  probeAll,
  totalsOf,
  type PlatformTotals,
  type TenantVitals,
} from './api/platform';

export interface PlatformState {
  tenants: Tenant[] | null;
  /** Keyed by tenant id. Fills in progressively while `sweeping` is true. */
  vitals: Record<string, TenantVitals>;
  totals: PlatformTotals | null;
  loading: boolean;
  /** The per-tenant sweep is still running; totals are partial. */
  sweeping: boolean;
  swept: number;
  error: string | null;
  reload: () => void;
}

/**
 * Loads the roster, then sweeps it.
 *
 * The two phases are reported separately on purpose. The roster itself is one fast call and the
 * shop list can be rendered the moment it lands; the sweep behind it is hundreds of requests and
 * takes as long as it takes. Collapsing both into a single `loading` would hold an empty screen
 * for the duration of the slow one, so screens using this render the names first and let the
 * numbers arrive underneath them.
 */
export function usePlatform(): PlatformState {
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [vitals, setVitals] = useState<Record<string, TenantVitals>>({});
  const [loading, setLoading] = useState(true);
  const [sweeping, setSweeping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // A reload started while a sweep is in flight must not have the old sweep's results land on top
  // of the new roster, so every run is tagged and stale results are dropped.
  const runRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const runId = runRef.current + 1;
    runRef.current = runId;

    const live = () => mountedRef.current && runRef.current === runId;

    // Entering the loading state is the point of this effect: it synchronises with an external
    // system (the API) on mount and on every dependency change. The lint rule below targets
    // derived state, which this is not.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setVitals({});

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
      setLoading(false);
      setSweeping(roster.length > 0);

      // The real aggregate endpoint answers in one call; only fall back to the old per-tenant
      // sweep if it's unavailable (e.g. a backend deployment that predates it).
      try {
        const rows = await fetchPlatformVitals();
        if (!live()) return;
        setVitals(Object.fromEntries(rows.map((v) => [v.tenantId, v])));
        setSweeping(false);
        return;
      } catch {
        // fall through to the client-side sweep below
      }

      await probeAll(
        roster.map((t) => t.id),
        (result) => {
          if (!live()) return;
          setVitals((prev) => ({ ...prev, [result.tenantId]: result }));
        },
      );

      if (!live()) return;
      setSweeping(false);
    })();
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const list = Object.values(vitals);
  const totals = tenants ? totalsOf(list, tenants) : null;

  return {
    tenants,
    vitals,
    totals,
    loading,
    sweeping,
    swept: list.length,
    error,
    reload,
  };
}
